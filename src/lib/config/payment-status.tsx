import {
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  CreditCard,
  Truck,
} from "lucide-react";
//付款狀態
export const getPaymentStatusInfo = (paymentStatus: string) => {
  switch (paymentStatus) {
    case "PAID":
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        text: "已付款",
        color: "bg-green-100 text-green-800",
      };
    case "PENDING":
      return {
        icon: <Clock className="h-5 w-5 text-yellow-600" />,
        text: "付款處理中",
        color: "bg-yellow-100 text-yellow-800",
      };
    case "UNPAID":
      return {
        icon: <Package className="h-5 w-5 text-orange-600" />,
        text: "尚未付款",
        color: "bg-orange-100 text-orange-800",
      };
    case "FAILED":
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        text: "付款失敗",
        color: "bg-red-100 text-red-800",
      };
    case "REFUNDED":
      return {
        icon: <RotateCcw className="h-5 w-5 text-blue-600" />,
        text: "已退款",
        color: "bg-blue-100 text-blue-800",
      };
    default:
      return {
        icon: <Clock className="h-5 w-5 text-neutral-600" />,
        text: "未知狀態",
        color: "bg-neutral-100 text-neutral-800",
      };
  }
};

// 付款方式標籤
export const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "online":
      return "線上付款";
    case "cash":
      return "貨到付款";
    case "transfer":
      return "銀行轉帳";
    default:
      return "其他";
  }
};

//訂單狀態
export const getOrderStatusInfo = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        text: "已確認",
        color: "bg-green-100 text-green-800",
      };
    case "PENDING":
      return {
        icon: <Clock className="h-5 w-5 text-blue-600" />,
        text: "等待確認",
        color: "bg-blue-100 text-blue-800",
      };
    case "PENDING_PAYMENT":
      return {
        icon: <CreditCard className="h-5 w-5 text-yellow-600" />,
        text: "等待付款",
        color: "bg-yellow-100 text-yellow-800",
      };
    case "PROCESSING":
      return {
        icon: <Package className="h-5 w-5 text-purple-600" />,
        text: "處理中",
        color: "bg-purple-100 text-purple-800",
      };
    case "SHIPPED":
      return {
        icon: <Truck className="h-5 w-5 text-indigo-600" />,
        text: "已出貨",
        color: "bg-indigo-100 text-indigo-800",
      };
    default:
      return {
        icon: <Clock className="h-5 w-5 text-neutral-600" />,
        text: "未知狀態",
        color: "bg-neutral-100 text-neutral-800",
      };
  }
};
