export declare const DeliveryStatus: {
    readonly PENDING: "PENDING";
    readonly DELIVERED: "DELIVERED";
    readonly FAILED: "FAILED";
};
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
