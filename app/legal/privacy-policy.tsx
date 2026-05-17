import LegalDocumentScreen from '@/components/LegalDocumentScreen';
import { PRIVACY_POLICY } from '@/lib/legal-documents';

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}
