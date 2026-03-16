"use server";

import { prisma } from "@/lib/prisma";
import { Product, Category } from "@prisma/client";

export interface searchParams {
  query?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// 定義包含 category 關聯的產品類型
export interface ProductWithCategory extends Product {
  category: Category;
}

export interface searchResult {
  products: ProductWithCategory[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const getProductFormSearch = async (
  searchParams: searchParams,
): Promise<searchResult> => {
  try {
    const {
      query,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = searchParams;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (query && query.trim()) {
      whereConditions.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereConditions,
        include: {
          category: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: whereConditions,
      }),
    ]);

    return {
      products, // 現在類型匹配了
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error("搜尋錯誤:", error);
    throw new Error("搜尋時發生錯誤");
  }
};
