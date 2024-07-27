import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private connectedClients = new Map<string, Socket>();

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    // Assuming the client sends its customerId upon connection
    client.on('register', (customerId: string) => {
      this.connectedClients.set(customerId, client);
      console.log(`Client registered: ${client.id} with customerId: ${customerId}`);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove the client from the connected clients map
    this.connectedClients.forEach((value, key) => {
      if (value.id === client.id) {
        this.connectedClients.delete(key);
      }
    });
  }

  notifyAdmin(event: string, payload: any) {
    console.log(`Emitting event: ${event}`, payload); // Log the emitted event
    this.server.emit(event, payload);
  }

  notifyCustomer(event: string, payload: any) {
    console.log(`Emitting event: ${event}`, payload); // Log the emitted event
    const customerSocket = this.connectedClients.get(payload.customerId);
    if (customerSocket) {
      customerSocket.emit(event, payload);
    } else {
      console.log(`Customer not connected for event: ${event}`);
    }
  }

  @SubscribeMessage('openingBidMade')
  handleOpeningBid(client: Socket, payload: { message:string, orderID: number, bidValue: number, adminName: string, customerId: string }) {
    this.notifyCustomer('openingBidMade', payload);
  }

  @SubscribeMessage('bidAction')
  handleBidAction(client: Socket, payload: { message: string, orderId: number, customerId: number, bidId: number }) {
    client.broadcast.emit('bidAction', payload); // Broadcast to all connected admins
  }

  @SubscribeMessage('counterBid')
  handleCounterBid(client: Socket, payload: { message: string, bidId: number, newOffer: number }) {
    client.broadcast.emit('counterBid', payload); // Broadcast to all connected admins
  }

  @SubscribeMessage('newOrder')
  handleNewOrder(client: Socket, payload: { message: string, orderId: number, customerId: number }) {
    client.broadcast.emit('newOrder', payload); // Broadcast to all connected admins
  }

  @SubscribeMessage('rideCancelled')
  handleRideCancelled(client: Socket, payload: { message: string, reason: string, rider: any, task: any }) {
    client.broadcast.emit('rideCancelled', payload); // Broadcast to all connected admins
  }
}
