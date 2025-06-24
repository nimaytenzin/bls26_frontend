import { BASEAPI_URL } from '../constants/constants';

export function GETMEDIAURL(uri: string): string {
	return `${BASEAPI_URL}${uri}`;
}
