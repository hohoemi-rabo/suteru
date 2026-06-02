import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/Colors';

import { identifyItem, type IdentifyResult } from '@/lib/api';
import { useData } from '@/lib/data-loader';
import { normalizeJa, searchItems } from '@/lib/text-search';
import type { Item } from '@/types';

const RESIZE_WIDTH_PX = 1280;
const JPEG_COMPRESS = 0.7;
/**
 * 判定枠の比率（min(画面幅, 画面高さ) に対する正方形の一辺の割合）。
 * 写真クロップにも同じ比率を使う：min(photo.width, photo.height) * FRAME_RATIO の中心正方形を切り出す。
 */
const FRAME_RATIO = 0.75;
/** 枠を画面中心からどれだけ上にオフセットするか（シャッターボタン分の余白） */
const FRAME_VERTICAL_OFFSET = 40;

// ============================================================
// 状態モデル
// ============================================================

type CameraState =
  | { kind: 'ready' }
  | { kind: 'processing' }
  | { kind: 'result'; outcome: IdentifyOutcome };

type IdentifyOutcome =
  | { kind: 'hit'; item: Item }
  | { kind: 'unknown_name'; rawName: string }
  | { kind: 'not_identifiable'; reason: 'could_not_identify' | 'not_garbage' }
  | { kind: 'error'; userMessage: string };

// ============================================================
// メイン画面
// ============================================================

export default function CameraScreen() {
  const data = useData();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [state, setState] = useState<CameraState>({ kind: 'ready' });
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 判定枠（中央寄り、シャッターの分だけ少し上にオフセット）の寸法・位置
  const frameSize = Math.min(screenWidth, screenHeight) * FRAME_RATIO;
  const frameLeft = (screenWidth - frameSize) / 2;
  const frameTop = (screenHeight - frameSize) / 2 - FRAME_VERTICAL_OFFSET;

  // 初回マウントで未確定なら許可ダイアログを要求
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('設定を開けませんでした', '端末の設定アプリから手動でカメラ許可を有効にしてください。');
    }
  };

  const handleShutter = async () => {
    if (state.kind !== 'ready') return;
    if (!cameraRef.current) return;

    setState({ kind: 'processing' });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // EXIF 正規化のため skipProcessing は false（既定）にしておく。
      // skipProcessing: true だと向きが端末依存になり、後段の crop 座標が
      // 画面上の枠と一致しなくなる。
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (!photo?.uri) {
        setState({
          kind: 'result',
          outcome: { kind: 'error', userMessage: '撮影に失敗しました。もう一度お試しください。' },
        });
        return;
      }

      // 画面の枠と同じ比率で写真の中心正方形をクロップ → 枠外を判定対象から外す
      const photoMinDim = Math.min(photo.width, photo.height);
      const cropSide = Math.floor(photoMinDim * FRAME_RATIO);
      const cropOriginX = Math.floor((photo.width - cropSide) / 2);
      const cropOriginY = Math.floor((photo.height - cropSide) / 2);

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: cropOriginX,
              originY: cropOriginY,
              width: cropSide,
              height: cropSide,
            },
          },
          { resize: { width: RESIZE_WIDTH_PX } },
        ],
        {
          compress: JPEG_COMPRESS,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!manipulated.base64) {
        setState({
          kind: 'result',
          outcome: { kind: 'error', userMessage: '画像の処理に失敗しました。' },
        });
        return;
      }

      const result = await identifyItem(manipulated.base64, 'image/jpeg');
      const outcome = toOutcome(result, data.items.items);
      if (outcome.kind === 'hit') {
        setState({ kind: 'ready' });
        router.push({
          pathname: '/result',
          params: { identifiedName: outcome.item.name, source: 'camera' },
        });
        return;
      }
      setState({ kind: 'result', outcome });
    } catch (err) {
      if (__DEV__) console.warn('[camera] shutter failed:', err);
      setState({
        kind: 'result',
        outcome: { kind: 'error', userMessage: '予期しないエラーが発生しました。' },
      });
    }
  };

  const handleCloseResult = () => setState({ kind: 'ready' });

  const handleGoToSearch = () => {
    setState({ kind: 'ready' });
    router.replace('/search');
  };

  // パーミッション未取得の中間表示
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-base text-white mt-4">カメラを起動しています…</Text>
      </SafeAreaView>
    );
  }

  // 権限拒否時
  if (!permission.granted) {
    return (
      <PermissionDenied
        canAskAgain={permission.canAskAgain}
        onRequest={() => void requestPermission()}
        onSettings={handleOpenSettings}
        onBack={handleBack}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <View className="flex-1">
        <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />

        <FrameOverlay
          frameSize={frameSize}
          frameLeft={frameLeft}
          frameTop={frameTop}
        />

        <TopOverlay onPressBack={handleBack} />
        <Shutter disabled={state.kind !== 'ready'} onPress={() => void handleShutter()} />

        {state.kind === 'processing' && <ProcessingOverlay />}
      </View>

      <ResultSheet
        outcome={state.kind === 'result' ? state.outcome : null}
        onClose={handleCloseResult}
        onGoToSearch={handleGoToSearch}
      />
    </SafeAreaView>
  );
}

// ============================================================
// 判定枠オーバーレイ（中心の四角枠 + 周囲の暗幕 + 角ブラケット + 撮影ヒント）
// ============================================================

function FrameOverlay({
  frameSize,
  frameLeft,
  frameTop,
}: {
  frameSize: number;
  frameLeft: number;
  frameTop: number;
}) {
  const frameRight = frameLeft + frameSize;
  const frameBottom = frameTop + frameSize;
  const bracket = Math.max(20, Math.round(frameSize * 0.08));
  const bracketThickness = 4;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      {/* 暗幕: 上 / 下 / 左 / 右 の 4 つで枠の外側を覆う */}
      <View
        className="absolute left-0 right-0 bg-black/55"
        style={{ top: 0, height: Math.max(0, frameTop) }}
      />
      <View
        className="absolute left-0 right-0 bg-black/55"
        style={{ top: frameBottom, bottom: 0 }}
      />
      <View
        className="absolute bg-black/55"
        style={{ top: frameTop, left: 0, width: frameLeft, height: frameSize }}
      />
      <View
        className="absolute bg-black/55"
        style={{ top: frameTop, right: 0, width: frameLeft, height: frameSize }}
      />

      {/* 枠の細い白枠線 */}
      <View
        className="absolute border border-white/60 rounded-2xl"
        style={{ top: frameTop, left: frameLeft, width: frameSize, height: frameSize }}
      />

      {/* 4 隅の白い角ブラケット（L 字） */}
      <View
        className="absolute"
        style={{
          top: frameTop - bracketThickness / 2,
          left: frameLeft - bracketThickness / 2,
          width: bracket,
          height: bracket,
          borderTopWidth: bracketThickness,
          borderLeftWidth: bracketThickness,
          borderColor: '#FFFFFF',
          borderTopLeftRadius: 16,
        }}
      />
      <View
        className="absolute"
        style={{
          top: frameTop - bracketThickness / 2,
          left: frameRight - bracket + bracketThickness / 2,
          width: bracket,
          height: bracket,
          borderTopWidth: bracketThickness,
          borderRightWidth: bracketThickness,
          borderColor: '#FFFFFF',
          borderTopRightRadius: 16,
        }}
      />
      <View
        className="absolute"
        style={{
          top: frameBottom - bracket + bracketThickness / 2,
          left: frameLeft - bracketThickness / 2,
          width: bracket,
          height: bracket,
          borderBottomWidth: bracketThickness,
          borderLeftWidth: bracketThickness,
          borderColor: '#FFFFFF',
          borderBottomLeftRadius: 16,
        }}
      />
      <View
        className="absolute"
        style={{
          top: frameBottom - bracket + bracketThickness / 2,
          left: frameRight - bracket + bracketThickness / 2,
          width: bracket,
          height: bracket,
          borderBottomWidth: bracketThickness,
          borderRightWidth: bracketThickness,
          borderColor: '#FFFFFF',
          borderBottomRightRadius: 16,
        }}
      />

      {/* 枠の下に撮影ヒント */}
      <View
        className="absolute left-0 right-0 items-center"
        style={{ top: frameBottom + 16 }}
      >
        <View className="rounded-full bg-black/55 px-4 py-2">
          <Text className="text-base text-white font-bold">
            ごみを枠の中に収めて撮影
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// 上部オーバーレイ（戻るボタン + プライバシー注記）
// ============================================================

function TopOverlay({ onPressBack }: { onPressBack: () => void }) {
  return (
    <View className="absolute top-4 left-4 right-4 flex-row justify-between items-center">
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        className="w-11 h-11 items-center justify-center rounded-full bg-black/40"
      >
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <View className="rounded-full bg-black/40 px-3 py-1.5">
        <Text className="text-sm text-white">画像は保存されません</Text>
      </View>
    </View>
  );
}

// ============================================================
// シャッターボタン
// ============================================================

function Shutter({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <View className="absolute bottom-12 self-center w-full items-center">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="撮影"
        className={`w-20 h-20 rounded-full items-center justify-center border-4 border-white ${disabled ? 'opacity-50' : ''}`}
      >
        <View className="w-16 h-16 rounded-full bg-white" />
      </Pressable>
    </View>
  );
}

// ============================================================
// 判定中オーバーレイ
// ============================================================

function ProcessingOverlay() {
  return (
    <View className="absolute inset-0 bg-black/60 items-center justify-center">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text className="text-lg text-white font-bold mt-4">判定中…</Text>
      <Text className="text-sm text-white opacity-80 mt-1">数秒お待ちください</Text>
    </View>
  );
}

// ============================================================
// 権限拒否画面
// ============================================================

function PermissionDenied({
  canAskAgain,
  onRequest,
  onSettings,
  onBack,
}: {
  canAskAgain: boolean;
  onRequest: () => void;
  onSettings: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 py-8 justify-between">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="戻る"
          className="w-11 h-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-back" size={24} color={Palette.text.primary} />
        </Pressable>

        <View className="items-center gap-6">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="camera" size={48} color={Palette.green[600]} />
          </View>
          <View className="gap-3">
            <Text className="text-2xl text-body font-bold text-center">
              カメラの許可が必要です
            </Text>
            <Text className="text-base text-body leading-relaxed text-center">
              写真を撮るだけで分別が分かるよう、カメラを使います。
              画像はサーバーにもこの端末にも保存されません。
            </Text>
          </View>
        </View>

        <View className="gap-3">
          {canAskAgain ? (
            <Pressable
              onPress={onRequest}
              className="min-h-11 rounded-full bg-green-400 px-6 py-3 items-center justify-center"
            >
              <Text className="text-lg text-white font-bold">カメラを許可する</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSettings}
              className="min-h-11 rounded-full bg-green-400 px-6 py-3 items-center justify-center"
            >
              <Text className="text-lg text-white font-bold">設定アプリを開く</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onBack}
            className="min-h-11 rounded-full border-2 border-line px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-muted">戻る</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// 結果モーダル（Bottom Sheet 風、4 outcome 出し分け）
// ============================================================

function ResultSheet({
  outcome,
  onClose,
  onGoToSearch,
}: {
  outcome: IdentifyOutcome | null;
  onClose: () => void;
  onGoToSearch: () => void;
}) {
  return (
    <Modal
      visible={!!outcome}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="閉じる"
      >
        <View
          className="rounded-t-3xl bg-bg p-6 gap-4"
          onStartShouldSetResponder={() => true}
        >
          <View className="self-center w-12 h-1 rounded-full bg-line" />

          {outcome?.kind === 'unknown_name' && (
            <UnknownNameContent
              rawName={outcome.rawName}
              onClose={onClose}
              onGoToSearch={onGoToSearch}
            />
          )}
          {outcome?.kind === 'not_identifiable' && (
            <NotIdentifiableContent onClose={onClose} onGoToSearch={onGoToSearch} />
          )}
          {outcome?.kind === 'error' && (
            <ErrorContent
              message={outcome.userMessage}
              onClose={onClose}
              onGoToSearch={onGoToSearch}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

function UnknownNameContent({
  rawName,
  onClose,
  onGoToSearch,
}: {
  rawName: string;
  onClose: () => void;
  onGoToSearch: () => void;
}) {
  return (
    <>
      <View className="self-start rounded-full bg-line px-3 py-1.5">
        <Text className="text-sm text-muted font-bold">辞書外</Text>
      </View>
      <Text className="text-2xl text-body font-bold">「{rawName}」は辞書にありません</Text>
      <Text className="text-base text-body leading-relaxed">
        AIは「{rawName}」と判定しましたが、飯田市のルール辞書にこの品目がまだ収録されていません。
        別の言い方で文字検索を試すか、公式情報でご確認ください。
      </Text>
      <View className="gap-2">
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-full bg-green-400 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">文字検索を試す</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-full border-2 border-line px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-muted">もう一度撮る</Text>
        </Pressable>
      </View>
    </>
  );
}

function NotIdentifiableContent({
  onClose,
  onGoToSearch,
}: {
  onClose: () => void;
  onGoToSearch: () => void;
}) {
  return (
    <>
      <View className="self-start rounded-full bg-danger-bg px-3 py-1.5">
        <Text className="text-sm text-danger font-bold">判定できませんでした</Text>
      </View>
      <Text className="text-2xl text-body font-bold">うまく判定できませんでした</Text>
      <Text className="text-base text-body leading-relaxed">
        明るい場所で品目を画面中央に大きく写すと判定しやすくなります。
      </Text>
      <View className="gap-2">
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-full bg-green-400 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">もう一度撮る</Text>
        </Pressable>
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-full border-2 border-line px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-muted">文字検索を試す</Text>
        </Pressable>
      </View>
    </>
  );
}

function ErrorContent({
  message,
  onClose,
  onGoToSearch,
}: {
  message: string;
  onClose: () => void;
  onGoToSearch: () => void;
}) {
  return (
    <>
      <View className="self-start rounded-full bg-danger-bg px-3 py-1.5">
        <Text className="text-sm text-danger font-bold">エラー</Text>
      </View>
      <Text className="text-2xl text-body font-bold">判定できませんでした</Text>
      <Text className="text-base text-body leading-relaxed">{message}</Text>
      <View className="gap-2">
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-full bg-green-400 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">もう一度撮る</Text>
        </Pressable>
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-full border-2 border-line px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-muted">文字検索を試す</Text>
        </Pressable>
      </View>
    </>
  );
}

// ============================================================
// ヘルパー
// ============================================================

function toOutcome(result: IdentifyResult, items: Item[]): IdentifyOutcome {
  if (!result.ok) {
    return { kind: 'error', userMessage: result.userMessage };
  }
  if (result.identifiedName === null) {
    return { kind: 'not_identifiable', reason: result.reason };
  }
  const q = normalizeJa(result.identifiedName);
  const exact = items.find((it) => normalizeJa(it.name) === q);
  if (exact) return { kind: 'hit', item: exact };
  const fuzzy = searchItems(items, result.identifiedName, 1)[0]?.item;
  if (fuzzy) return { kind: 'hit', item: fuzzy };
  return { kind: 'unknown_name', rawName: result.identifiedName };
}

