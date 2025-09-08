const About = () => {
  const team = [
    { name: 'Jenny Wilson', role: 'CEO & Founder' },
    { name: 'Jane Cooper', role: 'Worker' },
    { name: 'Cody Fisher', role: 'Security Guard' },
    { name: 'Robert Fox', role: 'Senior Farmer Manager' }
  ]

  const features = [
    { title: '100% Organic food', desc: '100% healthy & fresh food' },
    { title: 'Great Support 24/7', desc: 'Best support & contact' },
    { title: 'Customer Feedback', desc: 'Our happy customer' },
    { title: '100% Secure Payment', desc: 'We ensure your money' },
    { title: 'Free Shipping', desc: 'Free shipping with discount' },
    { title: '100% Organic Food', desc: '100% healthy & fresh food' }
  ]

  return (
    <div className="space-y-20">
      {/* Section 1: Text left, image right */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">100% Trusted Organic Food Store</h2>
          <p className="text-gray-600">Morbí porttitor ligula in nunc varius sagittis. Phasellus ut diam dui, laoreet ut tempor ac, cursus vitae eros. Cras quis ultricies elit. Praesent a lacus eu massa volutpat ornare. Vivamus ornare commodo ante, et commodo felis congue vitae.</p>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          {/* Replace with your image */}
          <div className="w-full h-full grid place-items-center text-gray-400">Ảnh giới thiệu</div>
        </div>
      </section>

      {/* Section 2: Image left, features right */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <div className="w-full h-full grid place-items-center text-gray-400">Ảnh nông trại</div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">100% Trusted Organic Food Store</h3>
          <p className="text-gray-600 mb-6">Pellentesque a ante vulputate leo porttitor luctus nec laoreet arcu. Nulla et rhoncus neque. Duis non erat sem. Aenean nec nisl consequat tortor tincidunt feugiat.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 grid place-items-center">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                  <p className="text-xs text-gray-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Delivery CTA */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-gray-900">We Delivered, You Enjoy Your Order.</h3>
          <p className="text-gray-600">Ut suscipit eget mi vel posuere pellentesque nunc, ultrices consectetur velit quam. Mauris sollicitudin dignissim diam, et dictum lacus elementum.</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2"><span className="text-green-600">•</span> Siêu thị miễn phí vận chuyển</li>
            <li className="flex items-center gap-2"><span className="text-green-600">•</span> Giao hàng nhanh chóng, muộn nhất trong ngày</li>
            <li className="flex items-center gap-2"><span className="text-green-600">•</span> Miễn cước ít nhất trong tuần đầu</li>
          </ul>
          <button className="inline-flex items-center gap-2 bg-green-600 text-white rounded-full px-5 py-2 font-semibold">Mua ngay <span>→</span></button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <div className="w-full h-full grid place-items-center text-gray-400">Ảnh giao hàng</div>
        </div>
      </section>

      {/* Our Awesome Team */}
      <section>
        <div className="text-center mb-10">
          <h3 className="text-3xl font-bold text-gray-900">Our Awesome Team</h3>
          <p className="text-gray-600">Pellentesque a ante vulputate leo porttitor luctus sed eget arcu.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m) => (
            <div key={m.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-40 bg-gray-100 grid place-items-center text-gray-400">Ảnh thành viên</div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900">Cảm nhận của khách hàng</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600 mb-4">“Pellentesque eu nibh eget mauris congue mattis mattis nec tellus. Phasellus imperdiet elit eu magna dictum.”</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Khách hàng {i}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brands strip */}
      <section className="py-10 border rounded-xl bg-white">
        <div className="flex flex-wrap items-center justify-center gap-10 text-gray-400">
          {['steps','mango','food','book-off','g series'].map((b) => (
            <div key={b} className="h-8 w-24 bg-gray-100 rounded grid place-items-center text-xs uppercase">{b}</div>
          ))}
        </div>
      </section>

      {/* Subscribe band */}
      <section className="rounded-2xl bg-gray-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Subscribe our Newsletter</p>
          <p className="text-sm text-gray-600">Nhận tin khuyến mãi mới nhất mỗi tuần.</p>
        </div>
        <form className="flex w-full md:w-auto items-center gap-3">
          <input className="h-10 rounded-full border border-gray-300 px-4 text-sm w-full md:w-80" placeholder="Your email address" />
          <button className="h-10 px-5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700">Subscribe</button>
        </form>
      </section>
    </div>
  )
}

export default About
