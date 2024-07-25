import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway()
  export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    afterInit(server: Server) {
      console.log('WebSocket server initialized');
    }
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    notifyAdmin(event: string, payload: any) {
        console.log(`Emitting event: ${event}`, payload); // Log the emitted event
      this.server.emit(event, payload);
    }

    notifyCustomer(event: string, payload: any) {
        console.log(`Emitting event: ${event}`, payload); // Log the emitted event
        this.server.emit(event, payload);
      }
  }
  