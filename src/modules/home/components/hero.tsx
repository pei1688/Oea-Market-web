"use client";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CollectionProps } from "@/types/collections";

const Hero = ({ collections }: CollectionProps) => {
  const newArrival = collections.find((col) => col.name === "新品上市");
  const sales = collections.find((col) => col.name === "特價商品");
  const oea = collections.find((col) => col.name === "Oea選品");

  return (
    <section className="relative mx-auto h-100 w-full md:h-125 lg:h-175">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          <CarouselItem>
            <div className="relative h-100 w-full md:h-125 lg:h-175">
              <Image
                src="/banner1.jpg"
                alt="商品banner"
                className="object-cover shadow-xl"
                fill
                priority
                quality={60}
              />
              <div className="absolute top-40 left-5 max-w-xs md:top-30 md:left-10 lg:top-1/3 lg:left-20 lg:max-w-md">
                <p className="text-sm tracking-widest text-neutral-600 md:text-base">
                  NEW ARRIVAL
                </p>

                <h2 className="text-3xl leading-tight font-bold text-neutral-800 md:text-5xl lg:text-7xl">
                  重新定義你的日常
                </h2>

                <p className="text-sm text-neutral-600 md:text-base">
                  精選新品正式登場，為生活加入更多質感與細節。
                </p>

                <Button asChild className="mt-4 w-fit">
                  <Link href={`/collections/${newArrival?.id}/全部`}>
                    立即探索
                    <ArrowRight className="ml-2 size-5 text-neutral-100" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
            {" "}
            <div className="relative h-100 w-full md:h-125 lg:h-175">
              <Image
                src="/banner2.jpg"
                alt="商品banner"
                className="object-cover shadow-xl"
                fill
                priority
                quality={60}
              />
              <div className="absolute top-40 left-5 max-w-xs md:top-30 md:left-10 lg:top-1/3 lg:left-20 lg:max-w-md">
                <p className="text-sm tracking-widest text-neutral-600 md:text-base">
                  LIMITED OFFER
                </p>

                <h2 className="mt-2 text-3xl leading-tight font-bold text-neutral-800 md:text-5xl lg:text-7xl">
                  限時特惠
                </h2>

                <p className="mt-2 text-lg font-semibold text-fuchsia-700 md:text-2xl">
                  1/2 – 1/31
                </p>

                <p className="mt-3 text-sm text-neutral-600 md:text-base">
                  精選商品最低 5 折起，數量有限，售完為止。
                </p>
                <Button asChild className="mt-4 w-fit">
                  <Link href={`/collections/${sales?.id}/全部`}>
                    馬上搶購
                    <ArrowRight className="ml-2 size-5 text-neutral-100" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
            {" "}
            <div className="relative h-100 w-full md:h-150 lg:h-175">
              <Image
                src="/banner3.jpg"
                alt="商品banner"
                className="object-cover shadow-xl"
                fill
                priority
                quality={60}
              />
              <div className="absolute top-40 left-5 max-w-xs md:top-30 md:left-10 lg:top-1/3 lg:left-20 lg:max-w-md">
                <p className="text-sm tracking-widest text-neutral-800 md:text-base">
                  OUR STORY
                </p>

                <h2 className="mt-2 text-3xl leading-tight font-bold text-neutral-800 md:text-5xl lg:text-7xl">
                  為生活而設計
                </h2>

                <p className="mt-3 text-sm text-neutral-800 md:text-base">
                  我們相信簡約與實用能並存，讓每一天都更自在。
                </p>

                <Button asChild className="mt-4 w-fit">
                  <Link href={`/collections/${oea?.id}/全部`}>
                    了解更多
                    <ArrowRight className="ml-2 size-5 text-neutral-100" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default Hero;
