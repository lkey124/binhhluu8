import { Peer, DataConnection } from "peerjs";
import { P2PMessage } from "../types";

// Prefix to avoid collision on public PeerJS server
const APP_PREFIX = "liar-game-tet-2025-";

export class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map(); // For Host: list of guests
  private hostConnection: DataConnection | null = null; // For Guest: connection to host
  private onMessageCallback: ((msg: P2PMessage) => void) | null = null;

  constructor() {}

  // --- Common ---
  
  public setOnMessage(cb: (msg: P2PMessage) => void) {
    this.onMessageCallback = cb;
  }

  public destroy() {
    this.peer?.destroy();
    this.connections.clear();
    this.hostConnection = null;
  }

  // --- Host Logic ---

  public async createRoom(): Promise<string> {
    const shortCode = Math.floor(10000 + Math.random() * 90000).toString();
    const peerId = APP_PREFIX + shortCode;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId);

      this.peer.on('open', (id) => {
        console.log('Host created room:', id);
        resolve(shortCode);
      });

      this.peer.on('connection', (conn) => {
        console.log('Guest connected:', conn.peer);
        this.setupConnection(conn);
        this.connections.set(conn.peer, conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  public broadcast(msg: P2PMessage) {
    this.connections.forEach(conn => {
        if (conn.open) conn.send(msg);
    });
  }

  // --- Guest Logic ---

  public async joinRoom(shortCode: string): Promise<void> {
     const hostId = APP_PREFIX + shortCode;
     
     // Generate random ID for guest
     this.peer = new Peer();

     return new Promise((resolve, reject) => {
        this.peer!.on('open', () => {
            const conn = this.peer!.connect(hostId);
            this.hostConnection = conn;
            
            conn.on('open', () => {
                console.log("Connected to Host");
                this.setupConnection(conn);
                resolve();
            });

            conn.on('error', (err) => reject(err));
            // Timeout if connection takes too long
            setTimeout(() => {
                if (!conn.open) reject(new Error("Connection timeout"));
            }, 5000);
        });

        this.peer!.on('error', (err) => reject(err));
     });
  }

  public sendToHost(msg: P2PMessage) {
      if (this.hostConnection?.open) {
          this.hostConnection.send(msg);
      }
  }

  // --- Internal ---

  private setupConnection(conn: DataConnection) {
      conn.on('data', (data) => {
          if (this.onMessageCallback) {
              this.onMessageCallback(data as P2PMessage);
          }
      });
      
      conn.on('close', () => {
          this.connections.delete(conn.peer);
      });
  }
}

export const peerService = new PeerService();