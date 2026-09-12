import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DeliveryModel = runtime.Types.Result.DefaultSelection<Prisma.$DeliveryPayload>;
export type AggregateDelivery = {
    _count: DeliveryCountAggregateOutputType | null;
    _avg: DeliveryAvgAggregateOutputType | null;
    _sum: DeliverySumAggregateOutputType | null;
    _min: DeliveryMinAggregateOutputType | null;
    _max: DeliveryMaxAggregateOutputType | null;
};
export type DeliveryAvgAggregateOutputType = {
    destinationStatus: number | null;
    attemptCount: number | null;
};
export type DeliverySumAggregateOutputType = {
    destinationStatus: number | null;
    attemptCount: number | null;
};
export type DeliveryMinAggregateOutputType = {
    id: string | null;
    eventType: string | null;
    destinationUrl: string | null;
    status: $Enums.DeliveryStatus | null;
    destinationStatus: number | null;
    errorMessage: string | null;
    attemptCount: number | null;
    nextAttemptAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    processingToken: string | null;
    processingExpiresAt: Date | null;
    waitReason: string | null;
};
export type DeliveryMaxAggregateOutputType = {
    id: string | null;
    eventType: string | null;
    destinationUrl: string | null;
    status: $Enums.DeliveryStatus | null;
    destinationStatus: number | null;
    errorMessage: string | null;
    attemptCount: number | null;
    nextAttemptAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    processingToken: string | null;
    processingExpiresAt: Date | null;
    waitReason: string | null;
};
export type DeliveryCountAggregateOutputType = {
    id: number;
    eventType: number;
    payload: number;
    destinationUrl: number;
    status: number;
    destinationStatus: number;
    errorMessage: number;
    attemptCount: number;
    nextAttemptAt: number;
    createdAt: number;
    updatedAt: number;
    processingToken: number;
    processingExpiresAt: number;
    waitReason: number;
    _all: number;
};
export type DeliveryAvgAggregateInputType = {
    destinationStatus?: true;
    attemptCount?: true;
};
export type DeliverySumAggregateInputType = {
    destinationStatus?: true;
    attemptCount?: true;
};
export type DeliveryMinAggregateInputType = {
    id?: true;
    eventType?: true;
    destinationUrl?: true;
    status?: true;
    destinationStatus?: true;
    errorMessage?: true;
    attemptCount?: true;
    nextAttemptAt?: true;
    createdAt?: true;
    updatedAt?: true;
    processingToken?: true;
    processingExpiresAt?: true;
    waitReason?: true;
};
export type DeliveryMaxAggregateInputType = {
    id?: true;
    eventType?: true;
    destinationUrl?: true;
    status?: true;
    destinationStatus?: true;
    errorMessage?: true;
    attemptCount?: true;
    nextAttemptAt?: true;
    createdAt?: true;
    updatedAt?: true;
    processingToken?: true;
    processingExpiresAt?: true;
    waitReason?: true;
};
export type DeliveryCountAggregateInputType = {
    id?: true;
    eventType?: true;
    payload?: true;
    destinationUrl?: true;
    status?: true;
    destinationStatus?: true;
    errorMessage?: true;
    attemptCount?: true;
    nextAttemptAt?: true;
    createdAt?: true;
    updatedAt?: true;
    processingToken?: true;
    processingExpiresAt?: true;
    waitReason?: true;
    _all?: true;
};
export type DeliveryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeliveryWhereInput;
    orderBy?: Prisma.DeliveryOrderByWithRelationInput | Prisma.DeliveryOrderByWithRelationInput[];
    cursor?: Prisma.DeliveryWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DeliveryCountAggregateInputType;
    _avg?: DeliveryAvgAggregateInputType;
    _sum?: DeliverySumAggregateInputType;
    _min?: DeliveryMinAggregateInputType;
    _max?: DeliveryMaxAggregateInputType;
};
export type GetDeliveryAggregateType<T extends DeliveryAggregateArgs> = {
    [P in keyof T & keyof AggregateDelivery]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDelivery[P]> : Prisma.GetScalarType<T[P], AggregateDelivery[P]>;
};
export type DeliveryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeliveryWhereInput;
    orderBy?: Prisma.DeliveryOrderByWithAggregationInput | Prisma.DeliveryOrderByWithAggregationInput[];
    by: Prisma.DeliveryScalarFieldEnum[] | Prisma.DeliveryScalarFieldEnum;
    having?: Prisma.DeliveryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DeliveryCountAggregateInputType | true;
    _avg?: DeliveryAvgAggregateInputType;
    _sum?: DeliverySumAggregateInputType;
    _min?: DeliveryMinAggregateInputType;
    _max?: DeliveryMaxAggregateInputType;
};
export type DeliveryGroupByOutputType = {
    id: string;
    eventType: string;
    payload: runtime.JsonValue;
    destinationUrl: string;
    status: $Enums.DeliveryStatus;
    destinationStatus: number | null;
    errorMessage: string | null;
    attemptCount: number;
    nextAttemptAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    processingToken: string | null;
    processingExpiresAt: Date | null;
    waitReason: string | null;
    _count: DeliveryCountAggregateOutputType | null;
    _avg: DeliveryAvgAggregateOutputType | null;
    _sum: DeliverySumAggregateOutputType | null;
    _min: DeliveryMinAggregateOutputType | null;
    _max: DeliveryMaxAggregateOutputType | null;
};
export type GetDeliveryGroupByPayload<T extends DeliveryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DeliveryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DeliveryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DeliveryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DeliveryGroupByOutputType[P]>;
}>>;
export type DeliveryWhereInput = {
    AND?: Prisma.DeliveryWhereInput | Prisma.DeliveryWhereInput[];
    OR?: Prisma.DeliveryWhereInput[];
    NOT?: Prisma.DeliveryWhereInput | Prisma.DeliveryWhereInput[];
    id?: Prisma.StringFilter<"Delivery"> | string;
    eventType?: Prisma.StringFilter<"Delivery"> | string;
    payload?: Prisma.JsonFilter<"Delivery">;
    destinationUrl?: Prisma.StringFilter<"Delivery"> | string;
    status?: Prisma.EnumDeliveryStatusFilter<"Delivery"> | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.IntNullableFilter<"Delivery"> | number | null;
    errorMessage?: Prisma.StringNullableFilter<"Delivery"> | string | null;
    attemptCount?: Prisma.IntFilter<"Delivery"> | number;
    nextAttemptAt?: Prisma.DateTimeNullableFilter<"Delivery"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Delivery"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Delivery"> | Date | string;
    processingToken?: Prisma.StringNullableFilter<"Delivery"> | string | null;
    processingExpiresAt?: Prisma.DateTimeNullableFilter<"Delivery"> | Date | string | null;
    waitReason?: Prisma.StringNullableFilter<"Delivery"> | string | null;
};
export type DeliveryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    destinationUrl?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    destinationStatus?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
    nextAttemptAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    processingToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    processingExpiresAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    waitReason?: Prisma.SortOrderInput | Prisma.SortOrder;
};
export type DeliveryWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.DeliveryWhereInput | Prisma.DeliveryWhereInput[];
    OR?: Prisma.DeliveryWhereInput[];
    NOT?: Prisma.DeliveryWhereInput | Prisma.DeliveryWhereInput[];
    eventType?: Prisma.StringFilter<"Delivery"> | string;
    payload?: Prisma.JsonFilter<"Delivery">;
    destinationUrl?: Prisma.StringFilter<"Delivery"> | string;
    status?: Prisma.EnumDeliveryStatusFilter<"Delivery"> | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.IntNullableFilter<"Delivery"> | number | null;
    errorMessage?: Prisma.StringNullableFilter<"Delivery"> | string | null;
    attemptCount?: Prisma.IntFilter<"Delivery"> | number;
    nextAttemptAt?: Prisma.DateTimeNullableFilter<"Delivery"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Delivery"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Delivery"> | Date | string;
    processingToken?: Prisma.StringNullableFilter<"Delivery"> | string | null;
    processingExpiresAt?: Prisma.DateTimeNullableFilter<"Delivery"> | Date | string | null;
    waitReason?: Prisma.StringNullableFilter<"Delivery"> | string | null;
}, "id">;
export type DeliveryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    destinationUrl?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    destinationStatus?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
    nextAttemptAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    processingToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    processingExpiresAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    waitReason?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.DeliveryCountOrderByAggregateInput;
    _avg?: Prisma.DeliveryAvgOrderByAggregateInput;
    _max?: Prisma.DeliveryMaxOrderByAggregateInput;
    _min?: Prisma.DeliveryMinOrderByAggregateInput;
    _sum?: Prisma.DeliverySumOrderByAggregateInput;
};
export type DeliveryScalarWhereWithAggregatesInput = {
    AND?: Prisma.DeliveryScalarWhereWithAggregatesInput | Prisma.DeliveryScalarWhereWithAggregatesInput[];
    OR?: Prisma.DeliveryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DeliveryScalarWhereWithAggregatesInput | Prisma.DeliveryScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Delivery"> | string;
    eventType?: Prisma.StringWithAggregatesFilter<"Delivery"> | string;
    payload?: Prisma.JsonWithAggregatesFilter<"Delivery">;
    destinationUrl?: Prisma.StringWithAggregatesFilter<"Delivery"> | string;
    status?: Prisma.EnumDeliveryStatusWithAggregatesFilter<"Delivery"> | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.IntNullableWithAggregatesFilter<"Delivery"> | number | null;
    errorMessage?: Prisma.StringNullableWithAggregatesFilter<"Delivery"> | string | null;
    attemptCount?: Prisma.IntWithAggregatesFilter<"Delivery"> | number;
    nextAttemptAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Delivery"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Delivery"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Delivery"> | Date | string;
    processingToken?: Prisma.StringNullableWithAggregatesFilter<"Delivery"> | string | null;
    processingExpiresAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Delivery"> | Date | string | null;
    waitReason?: Prisma.StringNullableWithAggregatesFilter<"Delivery"> | string | null;
};
export type DeliveryCreateInput = {
    id?: string;
    eventType: string;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl: string;
    status?: $Enums.DeliveryStatus;
    destinationStatus?: number | null;
    errorMessage?: string | null;
    attemptCount?: number;
    nextAttemptAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    processingToken?: string | null;
    processingExpiresAt?: Date | string | null;
    waitReason?: string | null;
};
export type DeliveryUncheckedCreateInput = {
    id?: string;
    eventType: string;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl: string;
    status?: $Enums.DeliveryStatus;
    destinationStatus?: number | null;
    errorMessage?: string | null;
    attemptCount?: number;
    nextAttemptAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    processingToken?: string | null;
    processingExpiresAt?: Date | string | null;
    waitReason?: string | null;
};
export type DeliveryUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    attemptCount?: Prisma.IntFieldUpdateOperationsInput | number;
    nextAttemptAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    processingToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingExpiresAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    waitReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DeliveryUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    attemptCount?: Prisma.IntFieldUpdateOperationsInput | number;
    nextAttemptAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    processingToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingExpiresAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    waitReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DeliveryCreateManyInput = {
    id?: string;
    eventType: string;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl: string;
    status?: $Enums.DeliveryStatus;
    destinationStatus?: number | null;
    errorMessage?: string | null;
    attemptCount?: number;
    nextAttemptAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    processingToken?: string | null;
    processingExpiresAt?: Date | string | null;
    waitReason?: string | null;
};
export type DeliveryUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    attemptCount?: Prisma.IntFieldUpdateOperationsInput | number;
    nextAttemptAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    processingToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingExpiresAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    waitReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DeliveryUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    eventType?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    destinationUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumDeliveryStatusFieldUpdateOperationsInput | $Enums.DeliveryStatus;
    destinationStatus?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    attemptCount?: Prisma.IntFieldUpdateOperationsInput | number;
    nextAttemptAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    processingToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    processingExpiresAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    waitReason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type DeliveryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    destinationUrl?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    destinationStatus?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
    nextAttemptAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    processingToken?: Prisma.SortOrder;
    processingExpiresAt?: Prisma.SortOrder;
    waitReason?: Prisma.SortOrder;
};
export type DeliveryAvgOrderByAggregateInput = {
    destinationStatus?: Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
};
export type DeliveryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    destinationUrl?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    destinationStatus?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
    nextAttemptAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    processingToken?: Prisma.SortOrder;
    processingExpiresAt?: Prisma.SortOrder;
    waitReason?: Prisma.SortOrder;
};
export type DeliveryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    eventType?: Prisma.SortOrder;
    destinationUrl?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    destinationStatus?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
    nextAttemptAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    processingToken?: Prisma.SortOrder;
    processingExpiresAt?: Prisma.SortOrder;
    waitReason?: Prisma.SortOrder;
};
export type DeliverySumOrderByAggregateInput = {
    destinationStatus?: Prisma.SortOrder;
    attemptCount?: Prisma.SortOrder;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type EnumDeliveryStatusFieldUpdateOperationsInput = {
    set?: $Enums.DeliveryStatus;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type DeliverySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    eventType?: boolean;
    payload?: boolean;
    destinationUrl?: boolean;
    status?: boolean;
    destinationStatus?: boolean;
    errorMessage?: boolean;
    attemptCount?: boolean;
    nextAttemptAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    processingToken?: boolean;
    processingExpiresAt?: boolean;
    waitReason?: boolean;
}, ExtArgs["result"]["delivery"]>;
export type DeliverySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    eventType?: boolean;
    payload?: boolean;
    destinationUrl?: boolean;
    status?: boolean;
    destinationStatus?: boolean;
    errorMessage?: boolean;
    attemptCount?: boolean;
    nextAttemptAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    processingToken?: boolean;
    processingExpiresAt?: boolean;
    waitReason?: boolean;
}, ExtArgs["result"]["delivery"]>;
export type DeliverySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    eventType?: boolean;
    payload?: boolean;
    destinationUrl?: boolean;
    status?: boolean;
    destinationStatus?: boolean;
    errorMessage?: boolean;
    attemptCount?: boolean;
    nextAttemptAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    processingToken?: boolean;
    processingExpiresAt?: boolean;
    waitReason?: boolean;
}, ExtArgs["result"]["delivery"]>;
export type DeliverySelectScalar = {
    id?: boolean;
    eventType?: boolean;
    payload?: boolean;
    destinationUrl?: boolean;
    status?: boolean;
    destinationStatus?: boolean;
    errorMessage?: boolean;
    attemptCount?: boolean;
    nextAttemptAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    processingToken?: boolean;
    processingExpiresAt?: boolean;
    waitReason?: boolean;
};
export type DeliveryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "eventType" | "payload" | "destinationUrl" | "status" | "destinationStatus" | "errorMessage" | "attemptCount" | "nextAttemptAt" | "createdAt" | "updatedAt" | "processingToken" | "processingExpiresAt" | "waitReason", ExtArgs["result"]["delivery"]>;
export type $DeliveryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Delivery";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        eventType: string;
        payload: runtime.JsonValue;
        destinationUrl: string;
        status: $Enums.DeliveryStatus;
        destinationStatus: number | null;
        errorMessage: string | null;
        attemptCount: number;
        nextAttemptAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        processingToken: string | null;
        processingExpiresAt: Date | null;
        waitReason: string | null;
    }, ExtArgs["result"]["delivery"]>;
    composites: {};
};
export type DeliveryGetPayload<S extends boolean | null | undefined | DeliveryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DeliveryPayload, S>;
export type DeliveryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DeliveryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DeliveryCountAggregateInputType | true;
};
export interface DeliveryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Delivery'];
        meta: {
            name: 'Delivery';
        };
    };
    findUnique<T extends DeliveryFindUniqueArgs>(args: Prisma.SelectSubset<T, DeliveryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DeliveryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DeliveryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DeliveryFindFirstArgs>(args?: Prisma.SelectSubset<T, DeliveryFindFirstArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DeliveryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DeliveryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DeliveryFindManyArgs>(args?: Prisma.SelectSubset<T, DeliveryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DeliveryCreateArgs>(args: Prisma.SelectSubset<T, DeliveryCreateArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DeliveryCreateManyArgs>(args?: Prisma.SelectSubset<T, DeliveryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DeliveryCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DeliveryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DeliveryDeleteArgs>(args: Prisma.SelectSubset<T, DeliveryDeleteArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DeliveryUpdateArgs>(args: Prisma.SelectSubset<T, DeliveryUpdateArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DeliveryDeleteManyArgs>(args?: Prisma.SelectSubset<T, DeliveryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DeliveryUpdateManyArgs>(args: Prisma.SelectSubset<T, DeliveryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DeliveryUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DeliveryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DeliveryUpsertArgs>(args: Prisma.SelectSubset<T, DeliveryUpsertArgs<ExtArgs>>): Prisma.Prisma__DeliveryClient<runtime.Types.Result.GetResult<Prisma.$DeliveryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DeliveryCountArgs>(args?: Prisma.Subset<T, DeliveryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DeliveryCountAggregateOutputType> : number>;
    aggregate<T extends DeliveryAggregateArgs>(args: Prisma.Subset<T, DeliveryAggregateArgs>): Prisma.PrismaPromise<GetDeliveryAggregateType<T>>;
    groupBy<T extends DeliveryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DeliveryGroupByArgs['orderBy'];
    } : {
        orderBy?: DeliveryGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DeliveryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeliveryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DeliveryFieldRefs;
}
export interface Prisma__DeliveryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DeliveryFieldRefs {
    readonly id: Prisma.FieldRef<"Delivery", 'String'>;
    readonly eventType: Prisma.FieldRef<"Delivery", 'String'>;
    readonly payload: Prisma.FieldRef<"Delivery", 'Json'>;
    readonly destinationUrl: Prisma.FieldRef<"Delivery", 'String'>;
    readonly status: Prisma.FieldRef<"Delivery", 'DeliveryStatus'>;
    readonly destinationStatus: Prisma.FieldRef<"Delivery", 'Int'>;
    readonly errorMessage: Prisma.FieldRef<"Delivery", 'String'>;
    readonly attemptCount: Prisma.FieldRef<"Delivery", 'Int'>;
    readonly nextAttemptAt: Prisma.FieldRef<"Delivery", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Delivery", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Delivery", 'DateTime'>;
    readonly processingToken: Prisma.FieldRef<"Delivery", 'String'>;
    readonly processingExpiresAt: Prisma.FieldRef<"Delivery", 'DateTime'>;
    readonly waitReason: Prisma.FieldRef<"Delivery", 'String'>;
}
export type DeliveryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where: Prisma.DeliveryWhereUniqueInput;
};
export type DeliveryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where: Prisma.DeliveryWhereUniqueInput;
};
export type DeliveryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where?: Prisma.DeliveryWhereInput;
    orderBy?: Prisma.DeliveryOrderByWithRelationInput | Prisma.DeliveryOrderByWithRelationInput[];
    cursor?: Prisma.DeliveryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeliveryScalarFieldEnum | Prisma.DeliveryScalarFieldEnum[];
};
export type DeliveryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where?: Prisma.DeliveryWhereInput;
    orderBy?: Prisma.DeliveryOrderByWithRelationInput | Prisma.DeliveryOrderByWithRelationInput[];
    cursor?: Prisma.DeliveryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeliveryScalarFieldEnum | Prisma.DeliveryScalarFieldEnum[];
};
export type DeliveryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where?: Prisma.DeliveryWhereInput;
    orderBy?: Prisma.DeliveryOrderByWithRelationInput | Prisma.DeliveryOrderByWithRelationInput[];
    cursor?: Prisma.DeliveryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeliveryScalarFieldEnum | Prisma.DeliveryScalarFieldEnum[];
};
export type DeliveryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeliveryCreateInput, Prisma.DeliveryUncheckedCreateInput>;
};
export type DeliveryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DeliveryCreateManyInput | Prisma.DeliveryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DeliveryCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    data: Prisma.DeliveryCreateManyInput | Prisma.DeliveryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DeliveryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeliveryUpdateInput, Prisma.DeliveryUncheckedUpdateInput>;
    where: Prisma.DeliveryWhereUniqueInput;
};
export type DeliveryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DeliveryUpdateManyMutationInput, Prisma.DeliveryUncheckedUpdateManyInput>;
    where?: Prisma.DeliveryWhereInput;
    limit?: number;
};
export type DeliveryUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeliveryUpdateManyMutationInput, Prisma.DeliveryUncheckedUpdateManyInput>;
    where?: Prisma.DeliveryWhereInput;
    limit?: number;
};
export type DeliveryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where: Prisma.DeliveryWhereUniqueInput;
    create: Prisma.XOR<Prisma.DeliveryCreateInput, Prisma.DeliveryUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DeliveryUpdateInput, Prisma.DeliveryUncheckedUpdateInput>;
};
export type DeliveryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
    where: Prisma.DeliveryWhereUniqueInput;
};
export type DeliveryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeliveryWhereInput;
    limit?: number;
};
export type DeliveryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeliverySelect<ExtArgs> | null;
    omit?: Prisma.DeliveryOmit<ExtArgs> | null;
};
