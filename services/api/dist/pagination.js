"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.pageEnvelope = pageEnvelope;
const zod_1 = require("zod");
const querySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
function parsePagination(query) {
    return querySchema.parse(query);
}
function pageEnvelope(items, total, page, pageSize) {
    return {
        data: items,
        page: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}
//# sourceMappingURL=pagination.js.map