import { Injectable, ProviderScope } from "@tsed/common";
import { StoreMerge, StoreSet, useDecorators } from "@tsed/core";
import { ROOM_CONTROLLER } from "../constants/constants";

export function RoomController(path: string, options: any = {}) {
  return useDecorators(
    Injectable({
      path,
      type: ROOM_CONTROLLER,
      scope: ProviderScope.REQUEST
    }),
    StoreMerge(ROOM_CONTROLLER, { options })
  );
}
