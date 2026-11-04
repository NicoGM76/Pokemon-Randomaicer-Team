import AppRouter from './router/AppRouter';
import { LocaleProvider } from './i18n/LocaleProvider';

export default function RootApp() {
  return <LocaleProvider><AppRouter /></LocaleProvider>;
}
