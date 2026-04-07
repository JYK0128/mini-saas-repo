import { AcceptLanguageResolver,
         I18nJsonLoader,
         I18nOptions } from 'nestjs-i18n';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const sourceDir = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

export const i18nConfig: I18nOptions = {
  fallbackLanguage: 'en',
  loaderOptions: {
    path: path.resolve(sourceDir, 'i18n'),
    watch: true,
  },
  resolvers: [AcceptLanguageResolver],
  loader: I18nJsonLoader,
};

export default i18nConfig;
