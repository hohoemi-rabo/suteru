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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { identifyItem, type IdentifyResult } from '@/lib/api';
import { useData } from '@/lib/data-loader';
import { normalizeJa, searchItems } from '@/lib/text-search';
import type { Item } from '@/types';

const RESIZE_WIDTH_PX = 1280;
const JPEG_COMPRESS = 0.7;

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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });
      if (!photo?.uri) {
        setState({
          kind: 'result',
          outcome: { kind: 'error', userMessage: '撮影に失敗しました。もう一度お試しください。' },
        });
        return;
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: RESIZE_WIDTH_PX } }],
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
        <CameraView
          ref={cameraRef}
          facing="back"
          style={{ flex: 1 }}
          onCameraReady={() => {
            // ready 状態は最初から true。Hook 仕様上ここで何もしなくて OK
          }}
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
        <Text className="text-xs text-white">画像は保存されません</Text>
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
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </Pressable>

        <View className="items-center gap-6">
          <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center">
            <Ionicons name="camera" size={48} color="#16A34A" />
          </View>
          <View className="gap-3">
            <Text className="text-2xl text-ink-900 font-bold text-center">
              カメラの許可が必要です
            </Text>
            <Text className="text-base text-ink-900 leading-relaxed text-center">
              写真を撮るだけで分別が分かるよう、カメラを使います。
              画像はサーバーにもこの端末にも保存されません。
            </Text>
          </View>
        </View>

        <View className="gap-3">
          {canAskAgain ? (
            <Pressable
              onPress={onRequest}
              className="min-h-11 rounded-xl bg-brand-500 px-6 py-3 items-center justify-center"
            >
              <Text className="text-lg text-white font-bold">カメラを許可する</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSettings}
              className="min-h-11 rounded-xl bg-brand-500 px-6 py-3 items-center justify-center"
            >
              <Text className="text-lg text-white font-bold">設定アプリを開く</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onBack}
            className="min-h-11 rounded-xl border-2 border-ink-200 px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-ink-500">戻る</Text>
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
          <View className="self-center w-12 h-1 rounded-full bg-ink-200" />

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
      <View className="self-start rounded-full bg-ink-200 px-3 py-1.5">
        <Text className="text-sm text-ink-500 font-bold">辞書外</Text>
      </View>
      <Text className="text-2xl text-ink-900 font-bold">「{rawName}」は辞書にありません</Text>
      <Text className="text-base text-ink-900 leading-relaxed">
        AIは「{rawName}」と判定しましたが、飯田市のルール辞書にこの品目がまだ収録されていません。
        別の言い方で文字検索を試すか、公式情報でご確認ください。
      </Text>
      <View className="gap-2">
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">文字検索を試す</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-xl border-2 border-ink-200 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-ink-500">もう一度撮る</Text>
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
      <View className="self-start rounded-full bg-warn-100 px-3 py-1.5">
        <Text className="text-sm text-warn-600 font-bold">判定できませんでした</Text>
      </View>
      <Text className="text-2xl text-ink-900 font-bold">うまく判定できませんでした</Text>
      <Text className="text-base text-ink-900 leading-relaxed">
        明るい場所で品目を画面中央に大きく写すと判定しやすくなります。
      </Text>
      <View className="gap-2">
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">もう一度撮る</Text>
        </Pressable>
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-xl border-2 border-ink-200 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-ink-500">文字検索を試す</Text>
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
      <View className="self-start rounded-full bg-warn-100 px-3 py-1.5">
        <Text className="text-sm text-warn-600 font-bold">エラー</Text>
      </View>
      <Text className="text-2xl text-ink-900 font-bold">判定できませんでした</Text>
      <Text className="text-base text-ink-900 leading-relaxed">{message}</Text>
      <View className="gap-2">
        <Pressable
          onPress={onClose}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">もう一度撮る</Text>
        </Pressable>
        <Pressable
          onPress={onGoToSearch}
          className="min-h-11 rounded-xl border-2 border-ink-200 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-ink-500">文字検索を試す</Text>
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

