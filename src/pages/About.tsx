function About() {
  const team = [
    { name: 'Nguyễn Văn A', role: 'CEO & Người sáng lập' },
    { name: 'Trần Thị B', role: 'Nhân viên' },
    { name: 'Lê Văn C', role: 'Bảo vệ' },
    { name: 'Phạm Văn D', role: 'Quản lý trang trại cấp cao' }
  ]

  const features = [
    { title: '100% Thực phẩm hữu cơ', desc: '100% lành mạnh & tươi ngon' },
    { title: 'Hỗ trợ 24/7', desc: 'Hỗ trợ tốt nhất & liên hệ' },
    { title: 'Phản hồi khách hàng', desc: 'Khách hàng hài lòng' },
    { title: '100% Thanh toán an toàn', desc: 'Chúng tôi đảm bảo tiền của bạn' },
    { title: 'Miễn phí vận chuyển', desc: 'Miễn phí vận chuyển với giảm giá' },
    { title: '100% Thực phẩm hữu cơ', desc: '100% lành mạnh & tươi ngon' }
  ]

  return (
    <div className="space-y-20">
      {/* Section 1: Text left, image right */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Siêu Thị Thực Phẩm Hữu Cơ Đáng Tin Cậy 100%</h2>
          <p className="text-gray-600">Chúng tôi cam kết mang đến cho bạn những sản phẩm thực phẩm tươi ngon, chất lượng cao nhất. Tất cả sản phẩm đều được chọn lọc kỹ càng từ các trang trại hữu cơ đạt chuẩn quốc tế, đảm bảo an toàn và giàu dinh dưỡng cho sức khỏe gia đình bạn.</p>
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
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Siêu Thị Thực Phẩm Hữu Cơ Đáng Tin Cậy 100%</h3>
          <p className="text-gray-600 mb-6">Với kinh nghiệm hơn 10 năm trong lĩnh vực thực phẩm hữu cơ, chúng tôi tự hào là đối tác đáng tin cậy của hàng ngàn gia đình Việt Nam. Mang đến cho bạn những trải nghiệm mua sắm tốt nhất.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                <span className="w-8 h-8 rounded-full bg-green-100 text-primary-600 grid place-items-center">✓</span>
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
          <h3 className="text-3xl font-bold text-gray-900">Chúng Tôi Giao Hàng, Bạn Thưởng Thức Đơn Hàng.</h3>
          <p className="text-gray-600">Dịch vụ giao hàng nhanh chóng, đúng giờ và đảm bảo chất lượng sản phẩm khi đến tay bạn. Chúng tôi cam kết mang lại sự hài lòng tuyệt đối cho khách hàng.</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Siêu thị miễn phí vận chuyển</li>
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Giao hàng nhanh chóng, muộn nhất trong ngày</li>
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Miễn cước ít nhất trong tuần đầu</li>
          </ul>
          <button className="inline-flex items-center gap-2 bg-primary-600 text-white rounded-full px-5 py-2 font-semibold">Mua ngay <span>→</span></button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <div className="w-full h-full grid place-items-center text-gray-400">Ảnh giao hàng</div>
        </div>
      </section>

      {/* Our Awesome Team */}
      <section>
        <div className="text-center mb-10">
          <h3 className="text-3xl font-bold text-gray-900">Đội Ngũ Xuất Sắc Của Chúng Tôi</h3>
          <p className="text-gray-600">Những con người tâm huyết, giàu kinh nghiệm và luôn nỗ lực hết mình vì sự hài lòng của khách hàng.</p>
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
                  <p className="text-xs text-gray-500">Khách hàng</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  )
}

export default About
