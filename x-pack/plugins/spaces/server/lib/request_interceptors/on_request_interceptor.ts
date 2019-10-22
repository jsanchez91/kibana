/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import {
  KibanaRequest,
  OnPreAuthToolkit,
  LifecycleResponseFactory,
  CoreSetup,
} from 'src/core/server';
import { format } from 'url';
import { DEFAULT_SPACE_ID } from '../../../common/constants';
import { modifyUrl } from '../utils/url';
import { LegacyAPI } from '../../plugin';
import { getSpaceIdFromPath } from '../../../common';

export interface OnRequestInterceptorDeps {
  getLegacyAPI(): LegacyAPI;
  http: CoreSetup['http'];
}
export function initSpacesOnRequestInterceptor({ getLegacyAPI, http }: OnRequestInterceptorDeps) {
  http.registerOnPreAuth(async function spacesOnPreAuthHandler(
    request: KibanaRequest,
    response: LifecycleResponseFactory,
    toolkit: OnPreAuthToolkit
  ) {
    const serverBasePath = http.basePath.serverBasePath;
    const pathname = request.url.pathname;

    // If navigating within the context of a space, then we store the Space's URL Context on the request,
    // and rewrite the request to not include the space identifier in the URL.
    const spaceId = getSpaceIdFromPath(pathname, serverBasePath);

    if (spaceId !== DEFAULT_SPACE_ID) {
      const reqBasePath = `/s/${spaceId}`;

      http.basePath.set(request, reqBasePath);

      const newLocation = (pathname && pathname.substr(reqBasePath.length)) || '/';

      const newUrl = modifyUrl(format(request.url), parts => {
        return {
          ...parts,
          pathname: newLocation,
        };
      });

      return toolkit.rewriteUrl(newUrl);
    }

    return toolkit.next();
  });
}
