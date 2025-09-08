import { Link } from 'react-router-dom'
import { CategoryCard, ProductCard, SectionHeader, PromoCard, TestimonialCard, NewsletterModal } from '@/components'
import bannerImg from '@/images/Bannar_Big-removebg-preview.png'
import freshFruit from '@/images/fresh_fruit.png'
import freshVegetables from '@/images/fresh_vegetables.png'
import meatFish from '@/images/meat_fish.jpg'
import snacksImg from '@/images/snacks.png'
import beveragesImg from '@/images/beverages.png'
import beautyHealthImg from '@/images/Beauty_Health.png'
import breadBakeryImg from '@/images/Bread_Bakery.png'
import bakingNeedsImg from '@/images/Baking_Needs.png'
import cookingImg from '@/images/cooking.png'
import diabeticFoodImg from '@/images/Diabetic_Food.png'
import dishDetergentsImg from '@/images/Dish_Detergents.png'
import oilImg from '@/images/oil.png'

const categories = [
  { name: 'Fresh Fruit', imageUrl: freshFruit },
  { name: 'Fresh Vegetables', imageUrl: freshVegetables },
  { name: 'Meat & Fish', imageUrl: meatFish },
  { name: 'Snacks', imageUrl: snacksImg },
  { name: 'Beverages', imageUrl: beveragesImg },
  { name: 'Beauty & Health', imageUrl: beautyHealthImg },
  { name: 'Bread & Bakery', imageUrl: breadBakeryImg },
  { name: 'Baking Needs', imageUrl: bakingNeedsImg },
  { name: 'Cooking', imageUrl: cookingImg },
  { name: 'Diabetic Food', imageUrl: diabeticFoodImg },
  { name: 'Dish Detergents', imageUrl: dishDetergentsImg },
  { name: 'Oil', imageUrl: oilImg },
]

const products = [
  { name: 'Green Apple', imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=800&auto=format&fit=crop', price: 12, originalPrice: 24 },
  { name: 'Spinach Leaves', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop', price: 8.5 },
  { name: 'Fresh Lettuce', imageUrl: 'https://images.unsplash.com/photo-1615486363623-ccfed2a58c17?q=80&w=800&auto=format&fit=crop', price: 6.25 },
  { name: 'Eggplant', imageUrl: 'https://images.unsplash.com/photo-1607301405390-0a1264fad5a7?q=80&w=800&auto=format&fit=crop', price: 7.1, originalPrice: 9.0 },
  { name: 'Tomatoes', imageUrl: 'https://images.unsplash.com/photo-1546470427-ea3b3f2a5a0c?q=80&w=800&auto=format&fit=crop', price: 5.7 },
  { name: 'Cucumber', imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800&auto=format&fit=crop', price: 4.15 },
  { name: 'Bell Pepper', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop', price: 3.85 },
  { name: 'Peach', imageUrl: 'https://images.unsplash.com/photo-1626808642875-0aa545482dfb?q=80&w=800&auto=format&fit=crop', price: 10.2 },
  { name: 'Orange', imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=800&auto=format&fit=crop', price: 6.9 },
  { name: 'Grapes', imageUrl: 'https://images.unsplash.com/photo-1576402187878-974f58d4dc67?q=80&w=800&auto=format&fit=crop', price: 9.4 },
]

const Home = () => {
  return (
    <div className="space-y-16">
      <NewsletterModal imageUrl={bannerImg} />
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-green-600 text-white rounded-2xl overflow-hidden relative">
          {/* Right-side banner image */}
          <img src={bannerImg} alt="Fresh & Healthy" className="hidden md:block absolute inset-y-0 right-0 h-full w-1/2 object-cover" />
          <div className="relative p-10 md:p-12 max-w-xl">
            <p className="uppercase tracking-wide text-green-100 text-sm mb-2">Welcome to Shopery</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Thực phẩm hữu cơ tươi và tốt cho sức khỏe</h1>
            <p className="mt-4 text-green-100 max-w-md">Giảm đến 30% OFF. Miễn phí vận chuyển cho đơn hàng đầu tiên.</p>
            <Link to="/contact" className="inline-block mt-6 bg-white text-green-700 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100">Mua ngay</Link>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900">Special Products</h3>
            <p className="text-sm text-gray-600">Deal of the Month</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900">Summer Sale</h3>
            <p className="text-sm text-gray-600">Up to 75% OFF</p>
          </div>
        </div>
      </section>

      {/* Service features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{title:'Miễn phí vận chuyển',subtitle:'Miễn phí vận chuyển mọi đơn hàng',icon:(<svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 9h4l3 3v3h-7V9zM5 21a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z" /></svg>)},{title:'Hỗ trợ 24/7',subtitle:'Hỗ trợ nhanh chóng tức thì',icon:(<svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13v5a2 2 0 01-2 2h-3l-3 3v-3H8a2 2 0 01-2-2v-5" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13a6 6 0 10-12 0" /></svg>)},{title:'Thanh toán an toàn',subtitle:'Bảo mật 100% cho mỗi giao dịch',icon:(<svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 7h20v6H2zM6 17h6" /><circle cx="18" cy="17" r="2" strokeWidth="2" /><circle cx="8" cy="17" r="2" strokeWidth="2" /></svg>)},{title:'Đảm bảo hoàn tiền',subtitle:'Hoàn tiền trong 30 ngày',icon:(<svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1l3 5 6 .9-4.5 4.1 1.1 6-5.6-3-5.6 3 1.1-6L3 6.9 9 6z" /></svg>)}].map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <div className="shrink-0">{item.icon}</div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Popular Categories */}
      <section>
        <SectionHeader title="Danh mục" action={<Link to="#" className="text-green-600 flex items-center gap-1">Tất cả <span>→</span></Link>} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.name} name={c.name} imageUrl={c.imageUrl} />
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section>
        <SectionHeader title="Sản phẩm nổi bật" action={<Link to="#" className="text-green-600">Xem tất cả →</Link>} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.slice(0,10).map((p) => (
            <ProductCard key={p.name} name={p.name} imageUrl={p.imageUrl} price={p.price} originalPrice={p.originalPrice} />
          ))}
        </div>
      </section>

      {/* Promo Banners */}
      <section>
        <div className="grid md:grid-cols-3 gap-6">
          <PromoCard label="Deal hot" title="Giảm giá trong tháng" subline="" bgClassName="bg-green-700" />
          <PromoCard label="85% Fat Free" title="Thịt ít béo" subline="Chỉ từ $79.99" bgClassName="bg-black" />
          <PromoCard label="Summer Sale" title="Trái cây 100% tươi" subline="Lên đến" badgeText="64% OFF" bgClassName="bg-yellow-400" />
        </div>
      </section>

      {/* Banner */}
      <section>
        <div className="rounded-2xl bg-gray-900 text-white p-10 flex items-center justify-between">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Tiết kiệm 37% trên mỗi đơn hàng</h3>
            <p className="text-gray-300 mt-2">Miễn phí vận chuyển cho đơn hàng đầu tiên.</p>
          </div>
          <Link to="#" className="bg-white text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100">Mua ngay</Link>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <SectionHeader title="Best Seller" action={<Link to="#" className="text-green-600">Xem tất cả →</Link>} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {products.slice(0,5).map((p) => (
            <ProductCard key={`featured-${p.name}`} name={p.name} imageUrl={p.imageUrl} price={p.price} originalPrice={p.originalPrice} />
          ))}
        </div>
      </section>

      {/* Client Testimonials */}
      <section>
        <SectionHeader title="Đánh giá của khách hàng" action={<div className="flex items-center gap-3"><button aria-label="Previous" className="w-9 h-9 rounded-full bg-white border border-gray-300 grid place-items-center hover:bg-gray-50"><svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg></button><button aria-label="Next" className="w-9 h-9 rounded-full bg-green-600 text-white grid place-items-center hover:bg-green-700"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></button></div>} />
        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard quote="Pellentesque eu nibh eget mauris congue mattis mattis nec tellus. Phasellus imperdiet elit eu magna dictum, bibendum cursus velit sodales. Donec sed neque eget" name="Robert Fox" />
          <TestimonialCard quote="Pellentesque eu nibh eget mauris congue mattis mattis nec tellus. Phasellus imperdiet elit eu magna dictum, bibendum cursus velit sodales. Donec sed neque eget" name="Dianne Russell" />
          <TestimonialCard quote="Pellentesque eu nibh eget mauris congue mattis mattis nec tellus. Phasellus imperdiet elit eu magna dictum, bibendum cursus velit sodales. Donec sed neque eget" name="Eleanor Pena" />
        </div>
      </section>
    </div>
  )
}

export default Home
