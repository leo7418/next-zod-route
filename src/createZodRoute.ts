import { RouteHandlerBuilder } from './routeHandlerBuilder';
import type { StatusMap } from './routeHandlerBuilder';
import type { HandlerFormData, HandlerServerErrorFn } from './types';

export const createZodRoute = (params?: {
  handleServerError?: HandlerServerErrorFn;
  handleFormData?: HandlerFormData;
  statusMap?: StatusMap;
}) =>
  new RouteHandlerBuilder({
    handleServerError: params?.handleServerError,
    handleFormData: params?.handleFormData,
    statusMap: params?.statusMap,
    contextType: {},
  });
