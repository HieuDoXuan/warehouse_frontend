import axios from "axios";

/**
 * Hàm xuất kho sau khi đơn hàng được phê duyệt.
 * @param {Object} approval - Thông tin phiếu đã được phê duyệt.
 * @param {string|number} userId - ID người thực hiện xuất kho.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function exportAfterApproval(approval, userId) {
  try {
    if (
      !approval ||
      approval.transactionType !== "Export" ||
      !approval.referenceCode ||
      approval.referenceCode.trim() === ""
    ) {
      return { success: false, message: "Vui lòng nhập mã phiếu trước khi xuất kho." };
    }

    await axios.post("https://localhost:7193/InventoryTransaction/export", {
      productId: approval.productId,
      warehouseId: approval.warehouseId,
      quantity: approval.quantity,
      unitId: approval.unitId,
      price: approval.price || null,
      referenceCode: approval.referenceCode,
      description: approval.description || "",
      createdBy: userId
    });

    return { success: true, message: "Xuất kho thành công!" };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Xuất kho thất bại!"
    };
  }
}