import LegalDocumentScreen from '@/components/LegalDocumentScreen';
import { TERMS_OF_USE } from '@/lib/legal-documents';

export default function TermsOfUseScreen() {
  return <LegalDocumentScreen document={TERMS_OF_USE} />;
}
