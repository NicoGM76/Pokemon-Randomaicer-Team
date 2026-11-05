import AppRouter from './router/AppRouter';
import { LocaleProvider } from './i18n/LocaleProvider';
import LoadFailureBoundary from './error/LoadFailureBoundary';

export default function RootApp() {
  return <LoadFailureBoundary scope="app"><LocaleProvider><AppRouter /></LocaleProvider></LoadFailureBoundary>;
}
