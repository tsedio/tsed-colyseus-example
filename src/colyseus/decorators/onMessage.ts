import { JsonEntityFn } from "@tsed/schema";
import { ROOM_CONTROLLER } from "../constants/constants";

export function OnMessage(messageType: string) {
  return JsonEntityFn((entity) => {
    entity.parent.store.merge(ROOM_CONTROLLER, {
      events: {
        [entity.propertyKey]: {
          kind: "onMessage",
          propertyKey: entity.propertyKey,
          messageType
        }
      }
    });
  });
}
