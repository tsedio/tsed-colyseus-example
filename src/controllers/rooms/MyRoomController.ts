import { MyRoomState } from "../../../template/src/rooms/schema/MyRoomState";
import { RoomController } from "../../colyseus/decorators/roomController";
import { Room, Client } from "@colyseus/core";
import { Inject } from "@tsed/di";
import { Logger } from "@tsed/common";
import { OnMessage } from "../../colyseus/decorators/onMessage";

@RoomController("my_room")
export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  @Inject()
  protected logger: Logger;

  // @OnMessage("type")
  onType(client: Client, message: any) {
    //
    // handle "type" message
    //
    this.logger.info("MyRoom received message from", client.sessionId, ":", message);
  }

  onCreate() {
    this.setState(new MyRoomState());

    this.logger.info("MyRoom is created and can use Ts.ED injector", this.roomId);
  }

  onJoin(client: Client, options: any) {
    this.logger.info(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    this.logger.info(client.sessionId, "left!");
  }

  onDispose() {
    this.logger.info("room", this.roomId, "disposing...");
  }
}
