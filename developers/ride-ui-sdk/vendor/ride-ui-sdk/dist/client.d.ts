import { type RideUiActionNameV1, type RideUiActionResultV1, type RideUiFastFrameV1, type RideUiDisplayFrameV1, type RideUiHostMessageV1, type RideUiInitContextV1, type RideUiSnapshotV1 } from './contract';
type Unsubscribe = () => void;
interface RideUiNativeTransport {
    postMessage(message: string): void;
}
declare global {
    interface Window {
        MotexaRideUiNativeBridge?: RideUiNativeTransport;
        __motexaRideUiNativeReceive?: (message: string) => void;
    }
}
export interface RideUiClient {
    ready(): void;
    subscribeSnapshot(listener: (snapshot: RideUiSnapshotV1) => void): Unsubscribe;
    subscribeFrame(listener: (frame: RideUiFastFrameV1) => void): Unsubscribe;
    subscribeDisplayFrame(listener: (frame: RideUiDisplayFrameV1) => void): Unsubscribe;
    subscribeContext(listener: (context: RideUiInitContextV1) => void): Unsubscribe;
    requestAction(action: RideUiActionNameV1, payload?: unknown): Promise<RideUiActionResultV1>;
    reportError(error: unknown): void;
    dispose(): void;
}
export declare const createRideUiClient: (themeId: string) => RideUiClient;
export type { RideUiHostMessageV1 };
