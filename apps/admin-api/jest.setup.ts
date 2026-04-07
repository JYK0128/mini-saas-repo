import dotenvx from '@dotenvx/dotenvx';
import console from 'console';

jest.setTimeout(1000 * 60 * 30);
global.console = console;
dotenvx.config({ path: '.env.development' });
