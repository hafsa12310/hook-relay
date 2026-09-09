export declare const DeliveryStatus: {
    readonly PENDING: "PENDING";
    readonly PROCESSING: "PROCESSING";
    readonly RETRY_SCHEDULED: "RETRY_SCHEDULED";
    readonly DELIVERED: "DELIVERED";
    readonly FAILED: "FAILED";
    readonly DEAD: "DEAD";
};
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
