import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: Category[];
}

interface HomeCategory extends Category {
  image: string;
}

const fallbackCategoryImages = [
  "https://images.unsplash.com/photo-1668191219162-b58465065deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1548568974-a4f8811a4bd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1770294758971-44fa1eae61a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1601393710008-984348f7447b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1569388330292-79cc1ec67270?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

const flattenCategories = (categories: Category[]): Category[] => {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children || []),
  ]);
};

const getDescendantIds = (category: Category): string[] => [
  category.id,
  ...(category.children || []).flatMap(getDescendantIds),
];

export function Home() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [hero, setHero] = useState<any>(null);
  const [isHeroLoading, setIsHeroLoading] = useState(true);

  useEffect(() => {
    const fetchHomeCategories = async () => {
      try {
        const [categoryRes, productRes]: any[] = await Promise.all([
          axiosClient.get("/categories"),
          axiosClient.get("/products"),
        ]);

        const categoryTree = categoryRes.data || [];
        const products = productRes.data || [];
        const allCategories = flattenCategories(categoryTree);

        const mappedCategories = allCategories.map((category, index) => {
          const categoryIds = getDescendantIds(category);
          const representativeProduct = products.find((product: any) =>
            categoryIds.includes(product.category_id)
          );

          return {
            ...category,
            image:
              representativeProduct?.thumbnail_url ||
              fallbackCategoryImages[index % fallbackCategoryImages.length],
          };
        });

        setCategories(mappedCategories);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    const fetchHero = async () => {
      try {
        const res: any = await axiosClient.get("/settings/hero");
        setHero(res.data);
      } catch (error) {
        console.error("Failed to fetch hero banner", error);
      } finally {
        setIsHeroLoading(false);
      }
    };

    fetchHomeCategories();
    fetchHero();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="relative h-[80vh] w-full bg-stone-900 flex items-center justify-center overflow-hidden">
        {isHeroLoading ? (
          <div className="absolute inset-0 bg-stone-800 animate-pulse"></div>
        ) : (
          <>
            <div
              className="absolute inset-0 z-0 opacity-60 bg-cover bg-center transition-opacity duration-1000"
              style={{ backgroundImage: `url('${hero?.imageUrl || '/hero-bg.jpg'}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10"></div>

            <div className="relative z-20 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
              <span className="text-rose-300 font-medium tracking-[0.2em] uppercase text-sm mb-4 animate-fade-in-down">
                {hero?.subtitle || 'Bộ Sưu Tập Nửa Đêm'}
              </span>
              <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight drop-shadow-lg animate-fade-in">
                {hero?.title?.split('<br />').map((text: string, i: number) => (
                  <span key={i}>
                    {text}
                    {i < hero.title.split('<br />').length - 1 && <br />}
                  </span>
                )) || (
                  <>Embrace Your <br /><span className="text-rose-400 italic">Elegance</span></>
                )}
              </h1>
              <p className="text-stone-200 text-lg md:text-xl mb-10 font-light max-w-xl animate-fade-in-up">
                {hero?.description || 'Khám phá những thiết kế nội y tôn vinh vẻ đẹp, mang lại sự tự tin tuyệt đối.'}
              </p>
              <Link
                to="/shop"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-medium tracking-widest text-white uppercase bg-rose-800 hover:bg-rose-700 overflow-hidden transition-all duration-300 rounded-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {hero?.buttonText || 'Khám Phá Ngay'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Featured Categories Slider */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <div className="flex items-center justify-between mb-12">
          <div className="flex-1 text-center">
            <h2 className="text-3xl font-serif text-rose-900 mb-2">Shop by Category</h2>
            <div className="w-16 h-0.5 bg-rose-300 mx-auto"></div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const slider = document.getElementById('category-slider');
                if (slider) slider.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </button>
            <button
              onClick={() => {
                const slider = document.getElementById('category-slider');
                if (slider) slider.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>

        <div
          id="category-slider"
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="group flex-none w-[85%] sm:w-[45%] lg:w-[calc(25%-18px)] relative overflow-hidden aspect-[4/5] bg-stone-100 rounded-sm snap-start"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <h3 className="text-xl font-serif text-white">{cat.name}</h3>
                <span className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 group-hover:bg-rose-600 group-hover:border-rose-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Privacy Promise Banner */}
      <section className="bg-rose-900 text-rose-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">Your Privacy is Our Priority</h2>
          <p className="text-rose-200/90 max-w-2xl mx-auto font-light leading-relaxed">
            Mọi đơn hàng đều được <strong>Giao Hàng Kín Đáo</strong>. Gói hàng được đóng trong hộp trơn không logo, và trên phiếu giao hàng sẽ chỉ ghi "Phụ kiện thời trang" nhằm bảo vệ sự riêng tư tuyệt đối cho bạn.
          </p>
        </div>
      </section>
    </div>
  );
}
