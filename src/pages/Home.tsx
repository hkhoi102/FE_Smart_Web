import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CategoryCard, ProductCard, SectionHeader, PromoCard, TestimonialCard } from '@/components'
import { CategoryService, type Category } from '@/services/categoryService'
import { ProductService, type Product } from '@/services/productService'
import bannerImg from '@/images/Bannar_Big-removebg-preview.png'
import freshFruit from '@/images/fresh_fruit.png'
import snacksImg from '@/images/snacks.png'
import beveragesImg from '@/images/beverages.png'
import breadBakeryImg from '@/images/Bread_Bakery.png'
import dishDetergentsImg from '@/images/Dish_Detergents.png'

// Mapping ảnh cho danh mục (fallback khi API không có ảnh)
const categoryImageMap: Record<string, string> = {
  'Đồ uống': beveragesImg,
  'Beverages': beveragesImg,
  'Đồ ăn vặt': snacksImg,
  'Snacks': snacksImg,
  'Sữa và sản phẩm từ sữa': freshFruit,
  'Dairy': freshFruit,
  'Hàng gia dụng': dishDetergentsImg,
  'Household': dishDetergentsImg,
  'Bánh': breadBakeryImg,
  'Bread': breadBakeryImg,
}

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load categories and products in parallel
        const [categoriesData, productsResponse] = await Promise.all([
          CategoryService.getCategories(),
          ProductService.getProducts(1, 10) // Get first 10 products
        ])

        setCategories(categoriesData)
        setProducts(productsResponse.products)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Không thể tải dữ liệu')
        setCategories([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper function để lấy ảnh cho danh mục
  const getCategoryImage = (category: Category) => {
    // Ưu tiên ảnh từ API
    if (category.imageUrl) {
      return category.imageUrl
    }
    // Fallback về mapping local
    return categoryImageMap[category.name] || freshFruit
  }
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-primary-600 text-white rounded-2xl overflow-hidden relative">
          {/* Right-side banner image */}
          <img src={bannerImg} alt="Fresh & Healthy" className="hidden md:block absolute inset-y-0 right-0 h-full w-1/2 object-cover" />
          <div className="relative p-10 md:p-12 max-w-xl">
            <p className="uppercase tracking-wide text-primary-100 text-sm mb-2">Chào mừng đến với Siêu Thị Thông Minh</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Thực phẩm hữu cơ tươi và tốt cho sức khỏe</h1>
            <p className="mt-4 text-primary-100 max-w-md">Giảm đến 30% OFF. Miễn phí vận chuyển cho đơn hàng đầu tiên.</p>
            <Link to="/contact" className="inline-block mt-6 bg-white text-primary-700 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100">Mua ngay</Link>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900">Sản phẩm đặc biệt</h3>
            <p className="text-sm text-gray-600">Uu đãi trong tháng</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900">Khuyến mãi hè</h3>
            <p className="text-sm text-gray-600">Giảm đến 75%</p>
          </div>
        </div>
      </section>

      {/* Service features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{title:'Miễn phí vận chuyển',subtitle:'Miễn phí vận chuyển mọi đơn hàng',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 9h4l3 3v3h-7V9zM5 21a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z" /></svg>)},{title:'Hỗ trợ 24/7',subtitle:'Hỗ trợ nhanh chóng tức thì',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13v5a2 2 0 01-2 2h-3l-3 3v-3H8a2 2 0 01-2-2v-5" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13a6 6 0 10-12 0" /></svg>)},{title:'Thanh toán an toàn',subtitle:'Bảo mật 100% cho mỗi giao dịch',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 7h20v6H2zM6 17h6" /><circle cx="18" cy="17" r="2" strokeWidth="2" /><circle cx="8" cy="17" r="2" strokeWidth="2" /></svg>)},{title:'Đảm bảo hoàn tiền',subtitle:'Hoàn tiền trong 30 ngày',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1l3 5 6 .9-4.5 4.1 1.1 6-5.6-3-5.6 3 1.1-6L3 6.9 9 6z" /></svg>)}].map((item) => (
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
        <SectionHeader title="Danh mục" action={<Link to="#" className="text-primary-600 flex items-center gap-1">Tất cả <span>→</span></Link>} />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-20 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  categoryId={category.id as any}
                  imageUrl={getCategoryImage(category)}
                  description={category.description}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có danh mục nào
              </div>
            )}
          </div>
        )}
      </section>

      {/* Popular Products */}
      <section>
        <SectionHeader title="Sản phẩm nổi bật" action={<Link to="#" className="text-primary-600">Xem tất cả →</Link>} />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.length > 0 ? (
              products.slice(0, 10).map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    imageUrl: product.imageUrl || undefined,
                    originalPrice: undefined
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>
        )}
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
        <SectionHeader title="Bán chạy nhất" action={<Link to="#" className="text-primary-600">Xem tất cả →</Link>} />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {products.length > 0 ? (
              products.slice(0, 5).map((product) => (
                <ProductCard
                  key={`featured-${product.id}`}
                  product={{
                    ...product,
                    imageUrl: product.imageUrl || undefined,
                    originalPrice: undefined
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>
        )}
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
