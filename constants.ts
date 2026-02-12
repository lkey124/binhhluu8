
import { TopicCategory } from './types';

export const ZODIAC_AVATARS = [
  '🐭', '🐮', '🐯', '🐱', '🐲', '🐍', '🐴', '🐐', '🐵', '🐔', '🐶', '🐷'
];

export const STATIC_TOPICS: TopicCategory[] = [
  {
    id: 'tet',
    name: 'Tết Nguyên Đán',
    words: [
        'Bánh chưng', 'Bánh tét', 'Hoa đào', 'Hoa mai', 'Lì xì', 'Pháo hoa', 'Múa lân', 'Táo quân', 'Giao thừa', 'Mâm ngũ quả', 
        'Hạt dưa', 'Ông đồ', 'Câu đối', 'Xông đất', 'Tất niên', 'Cây nêu', 'Thịt kho hột vịt', 'Dưa hành', 'Củ kiệu', 'Mứt tết',
        'Gà luộc', 'Xôi gấc', 'Chùa chiền', 'Hái lộc', 'Chúc tết', 'Áo dài', 'Về quê', 'Dọn nhà', 'Bàn thờ', 'Nhang trầm',
        'Lịch vạn niên', 'Tiền lẻ', 'Bài tây', 'Bầu cua', 'Lô tô', 'Hội chợ', 'Đường hoa', 'Phật thủ', 'Mãng cầu', 'Sung',
        'Dừa', 'Đu đủ', 'Xoài', 'Heo đất', 'Thần tài', 'Ông địa', 'Cúng tổ tiên', 'Rượu vang', 'Trà', 'Kẹo thèo lèo',
        'Hạt hướng dương', 'Hạt dẻ', 'Mứt dừa', 'Mứt gừng', 'Mứt bí', 'Mứt sen', 'Lạp xưởng', 'Giò lụa', 'Chả bò', 'Nem chua',
        'Canh măng', 'Bóng bì', 'Miến gà', 'Chân giò', 'Rượu nếp', 'Trầu cau', 'Vàng mã', 'Cây quất', 'Hoa cúc', 'Hoa vạn thọ',
        'Hoa lay ơn', 'Hoa ly', 'Hoa hồng', 'Nụ tầm xuân', 'Tranh đông hồ', 'Câu đối đỏ', 'Pháo tép', 'Múa rồng', 'Trống hội', 'Lễ hội',
        'Du xuân', 'Họp lớp', 'Tiệc tùng', 'Karaoke', 'Bánh quy', 'Chocolate', 'Bia', 'Nước ngọt', 'Khách khứa', 'Hàng xóm',
        'Trẻ con', 'Người già', 'Tuổi tác', 'Năm mới', 'Khai trương', 'Xuất hành', 'Hướng xuất hành', 'Tử vi', 'Xem bói', 'Đốt vàng mã',
        'Cúng xe', 'Cúng đất', 'Tảo mộ', 'Ông bà', 'Cha mẹ', 'Anh chị em', 'Đồng nghiệp', 'Bạn bè', 'Thầy cô', 'Sếp',
        'Nhà ngoại', 'Nhà nội', 'Làng xóm', 'Bến xe', 'Sân bay', 'Vé tàu', 'Mâm cơm', 'Hương trầm', 'Đỉnh đồng', 'Lư hương',
        'Gạo nếp', 'Đỗ xanh', 'Lá dong', 'Lạt giang', 'Củi lửa', 'Nồi bánh chưng', 'Thức đêm', 'Kể chuyện', 'Đánh bài', 'Xóc đĩa',
        'Chọi gà', 'Đấu vật', 'Kéo co', 'Đua thuyền', 'Cờ người', 'Đi lễ', 'Xin xăm', 'Gieo quẻ', 'Hóa vàng', 'Thụ lộc',
        'Bánh in', 'Bánh đậu xanh', 'Bánh phu thê', 'Bánh cốm', 'Rượu cần', 'Rượu đế', 'Bia lon', 'Nước yến', 'Giỏ quà', 'Hộp mứt',
        'Phong bao', 'Tiền mới', 'Lời chúc', 'Sức khỏe', 'Thành công', 'An khang', 'Thịnh vượng', 'Vạn sự', 'Như ý', 'Phát tài',
        'Trống đồng', 'Áo bà ba', 'Khăn đóng', 'Guốc mộc', 'Quạt giấy', 'Tranh tết', 'Thư pháp', 'Mực tàu', 'Giấy đỏ', 'Pháo giấy'
    ]
  },
  {
    id: 'common',
    name: 'Thông dụng',
    words: [
        'Cà phê', 'Xe máy', 'Phở', 'Bánh mì', 'Nón lá', 'Áo dài', 'Chợ Bến Thành', 'Hồ Gươm', 'Mũ bảo hiểm', 'Áo mưa',
        'Dép tổ ong', 'Cơm tấm', 'Trà đá', 'Vỉa hè', 'Kẹt xe', 'Xe buýt', 'Grab', 'Shipper', 'Bảo vệ', 'Công an',
        'Bác sĩ', 'Giáo viên', 'Học sinh', 'Sinh viên', 'Văn phòng', 'Máy lạnh', 'Quạt máy', 'Nồi cơm điện', 'Tủ lạnh', 'Máy giặt',
        'Ti vi', 'Điện thoại', 'Laptop', 'Wifi', 'Facebook', 'Tiktok', 'Youtube', 'Zalo', 'Ngân hàng', 'ATM',
        'Tiền mặt', 'Ví tiền', 'Chìa khóa', 'Khẩu trang', 'Nước rửa tay', 'Siêu thị', 'Tạp hóa', 'Quán nhậu', 'Quán ốc', 'Trà sữa',
        'Bánh tráng trộn', 'Xoài lắc', 'Cóc lắc', 'Me đá', 'Sâm bổ lượng', 'Chè', 'Tào phớ', 'Hủ tiếu', 'Bún bò', 'Bún riêu',
        'Mì quảng', 'Bánh canh', 'Nước mắm', 'Nước tương', 'Tương ớt', 'Muối tôm', 'Tiêu', 'Chanh', 'Đường', 'Sữa đặc',
        'Bánh mì ốp la', 'Xôi mặn', 'Bánh bao', 'Hột vịt lộn', 'Cút lộn', 'Bắp xào', 'Chuối nướng', 'Khoai lang nướng', 'Bánh chuối', 'Bánh khoai',
        'Vé số', 'Đánh giày', 'Bán hàng rong', 'Xe ôm', 'Bến xe', 'Sân bay', 'Ga tàu', 'Cầu vượt', 'Hầm thủ thiêm', 'Phố đi bộ',
        'Công viên', 'Rạp phim', 'Nhà sách', 'Thư viện', 'Bảo tàng', 'Nhà hát', 'Sân vận động', 'Hồ bơi', 'Phòng gym', 'Spa',
        'Cắt tóc', 'Gội đầu', 'Massage', 'Bệnh viện', 'Nhà thuốc', 'Chùa', 'Nhà thờ', 'Đám cưới', 'Đám ma', 'Sinh nhật',
        'Thôi nôi', 'Đầy tháng', 'Họp mặt', 'Liên hoan', 'Du lịch', 'Phượt', 'Check-in', 'Sống ảo', 'Đăng hình', 'Comment',
        'Like', 'Share', 'Follow', 'Inbox', 'Livestream', 'Shopee', 'Lazada', 'Tiki', 'Săn sale', 'Voucher',
        'Freeship', 'Hoàn xu', 'Đánh giá', 'Feedback', 'Review', 'Quảng cáo', 'Khuyến mãi', 'Giảm giá', 'Hàng hiệu', 'Hàng chợ',
        'Trả góp', 'Vay tiền', 'Tiết kiệm', 'Đầu tư', 'Chứng khoán', 'Bất động sản', 'Bitcoin', 'Vàng', 'Đô la', 'Xăng dầu',
        'Điện nước', 'Internet', 'Rác thải', 'Kẹt xe', 'Ngập nước', 'Khói bụi', 'Ô nhiễm', 'Nắng nóng', 'Mưa rào', 'Bão lũ'
    ]
  },
  {
    id: 'animals',
    name: 'Động vật',
    words: [
        'Con mèo', 'Con chó', 'Con gà', 'Con trâu', 'Sư tử', 'Cá heo', 'Chim cánh cụt', 'Hươu cao cổ', 'Con voi', 'Con khỉ',
        'Con hổ', 'Con báo', 'Con gấu', 'Gấu trúc', 'Gấu bắc cực', 'Con thỏ', 'Con sóc', 'Con chuột', 'Chuột túi', 'Chuột lang',
        'Con heo', 'Con bò', 'Con dê', 'Con cừu', 'Con ngựa', 'Ngựa vằn', 'Tê giác', 'Hà mã', 'Cá sấu', 'Con rùa',
        'Con ếch', 'Con cóc', 'Con rắn', 'Con trăn', 'Thằn lằn', 'Tắc kè', 'Khủng long', 'Đại bàng', 'Chim ưng', 'Cú mèo',
        'Chim sẻ', 'Chim bồ câu', 'Chim công', 'Chim đà điểu', 'Chim hồng hạc', 'Con vịt', 'Con ngan', 'Con ngỗng', 'Thiên nga', 'Cá mập',
        'Cá voi', 'Cá ngựa', 'Cá vàng', 'Cá chép', 'Cá lóc', 'Cá trê', 'Tôm', 'Cua', 'Ghẹ', 'Mực',
        'Bạch tuộc', 'Sứa', 'Sao biển', 'San hô', 'Hải cẩu', 'Sư tử biển', 'Lạc đà', 'Linh dương', 'Chó sói', 'Cáo',
        'Chồn', 'Nhím', 'Tê tê', 'Dơi', 'Ong', 'Bướm', 'Chuồn chuồn', 'Châu chấu', 'Dế mèn', 'Bọ rùa',
        'Kiến', 'Mối', 'Gián', 'Muỗi', 'Ruồi', 'Nhện', 'Bọ cạp', 'Rết', 'Cuốn chiếu', 'Giun đất',
        'Ốc sên', 'Con trai', 'Con hến', 'Con sò', 'Con hàu', 'Sâu', 'Tằm', 'Đom đóm', 'Ve sầu', 'Bọ ngựa',
        'Cá heo', 'Cá mập', 'Cá voi xanh', 'Cá kiếm', 'Cá đuối', 'Cá nóc', 'Cá hề', 'Cá hồi', 'Cá thu', 'Cá ngừ',
        'Tôm hùm', 'Cua hoàng đế', 'Bào ngư', 'Vi cá', 'Hải sâm', 'Sứa biển', 'Rùa biển', 'Ba ba', 'Cá sấu hoa cà', 'Trăn gấm',
        'Rắn hổ mang', 'Rắn lục', 'Tắc kè hoa', 'Kỳ nhông', 'Khủng long bạo chúa', 'Voi ma mút', 'Chim ưng', 'Diều hâu', 'Kền kền', 'Quạ đen',
        'Vẹt', 'Chim yến', 'Chim gõ kiến', 'Chim bói cá', 'Chim ruồi', 'Chim cánh cụt hoàng đế', 'Gấu koala', 'Lười', 'Chồn hương', 'Cầy hương'
    ]
  },
  {
    id: 'food',
    name: 'Ẩm thực',
    words: [
        'Bún đậu mắm tôm', 'Gỏi cuốn', 'Cơm tấm', 'Bún bò Huế', 'Chả giò', 'Bánh xèo', 'Mì Quảng', 'Hủ tiếu', 'Nem chua', 'Bánh mì',
        'Phở bò', 'Phở gà', 'Bún chả', 'Bún riêu', 'Bún mắm', 'Bún thịt nướng', 'Bánh canh cua', 'Bánh canh ghẹ', 'Bánh bèo', 'Bánh nậm',
        'Bánh bột lọc', 'Bánh cuốn', 'Bánh ướt', 'Xôi gà', 'Xôi xéo', 'Xôi khúc', 'Cháo lòng', 'Cháo gà', 'Cháo vịt', 'Gà luộc',
        'Gà nướng', 'Gà rán', 'Vịt quay', 'Heo quay', 'Thịt kho tàu', 'Cá kho tộ', 'Canh chua', 'Rau muống xào', 'Đậu hũ chiên', 'Trứng chiên',
        'Lẩu thái', 'Lẩu hải sản', 'Lẩu bò', 'Lẩu gà', 'Lẩu mắm', 'Lẩu dê', 'Nướng ngói', 'Bò né', 'Bò kho', 'Cà ri',
        'Cơm chiên', 'Mì xào', 'Nui xào', 'Súp cua', 'Gỏi gà', 'Gỏi đu đủ', 'Gỏi ngó sen', 'Nem nướng', 'Bò lá lốt', 'Chả cá',
        'Bánh tráng nướng', 'Bánh tráng trộn', 'Hột vịt lộn', 'Cút lộn xào me', 'Ốc hương', 'Ốc len', 'Sò lông', 'Sò điệp', 'Nghêu hấp', 'Cua rang me',
        'Mực nướng', 'Bạch tuộc nướng', 'Tôm nướng', 'Chè thái', 'Chè bưởi', 'Chè trôi nước', 'Sữa chua', 'Kem', 'Sinh tố', 'Nước ép',
        'Trà sữa', 'Cà phê sữa', 'Bạc xỉu', 'Cacao', 'Nước mía', 'Nước dừa', 'Rau má', 'Sữa đậu nành', 'Bia', 'Rượu',
        'Bánh pía', 'Bánh phồng tôm', 'Kẹo dừa', 'Nem lai vung', 'Tré', 'Chả bò', 'Mắm tôm chua', 'Mè xửng', 'Bánh đậu xanh', 'Bánh cáy',
        'Bánh gai', 'Bánh nhãn', 'Chả mực', 'Sá sùng', 'Gà đồi', 'Cơm lam', 'Thắng cố', 'Thịt trâu gác bếp', 'Rượu cần', 'Rượu ngô',
        'Lợn mán', 'Xôi ngũ sắc', 'Cá nướng trui', 'Lẩu cá kèo', 'Chuột đồng', 'Dế chiên', 'Đuông dừa', 'Gỏi sứa', 'Gỏi cá trích', 'Bún sứa',
        'Bánh căn', 'Bánh khọt', 'Hủ tiếu nam vang', 'Hủ tiếu sa tế', 'Mì vịt tiềm', 'Sủi cảo', 'Há cảo', 'Bột chiên', 'Phá lấu', 'Chè mè đen'
    ]
  },
  {
    id: 'places',
    name: 'Địa điểm',
    words: [
        'Trường học', 'Bệnh viện', 'Sân bay', 'Siêu thị', 'Công viên', 'Rạp chiếu phim', 'Nhà vệ sinh', 'Thư viện', 'Sở thú', 'Nhà hàng',
        'Khách sạn', 'Quán cà phê', 'Bảo tàng', 'Nhà hát', 'Sân vận động', 'Hồ bơi', 'Bãi biển', 'Núi', 'Rừng', 'Hang động',
        'Thác nước', 'Sông', 'Hồ', 'Suối', 'Sa mạc', 'Đảo', 'Thành phố', 'Làng quê', 'Nông trại', 'Cánh đồng',
        'Nhà ga', 'Bến xe', 'Bến cảng', 'Trạm xe buýt', 'Cây xăng', 'Đồn cảnh sát', 'Trạm cứu hỏa', 'Bưu điện', 'Ngân hàng', 'Ủy ban',
        'Công ty', 'Nhà máy', 'Văn phòng', 'Chợ', 'Trung tâm thương mại', 'Cửa hàng tiện lợi', 'Hiệu thuốc', 'Tiệm cắt tóc', 'Tiệm nail', 'Spa',
        'Phòng gym', 'Sân bóng đá', 'Sân tennis', 'Sân golf', 'Khu vui chơi', 'Công viên nước', 'Vườn hoa', 'Vườn bách thảo', 'Lăng tẩm', 'Đền đài',
        'Chùa', 'Nhà thờ', 'Thánh thất', 'Đình làng', 'Miếu', 'Nghĩa trang', 'Nhà tù', 'Trại quân đội', 'Vũ trụ', 'Mặt trăng',
        'Sao hỏa', 'Tàu vũ trụ', 'Trạm không gian', 'Nhà riêng', 'Chung cư', 'Biệt thự', 'Nhà trọ', 'Ký túc xá', 'Phòng ngủ', 'Phòng khách',
        'Nhà bếp', 'Nhà tắm', 'Ban công', 'Sân thượng', 'Tầng hầm', 'Gác xép', 'Cầu thang', 'Thang máy', 'Hành lang', 'Cổng',
        'Hàng rào', 'Vỉa hè', 'Lòng đường', 'Ngã tư', 'Vòng xoay', 'Cầu vượt', 'Hầm chui', 'Trạm thu phí', 'Bãi đậu xe', 'Gara',
        'Kho hàng', 'Xưởng gỗ', 'Lò gạch', 'Lò mổ', 'Bến phà', 'Hải đăng', 'Giàn khoan', 'Đập thủy điện', 'Ruộng bậc thang', 'Đồi chè',
        'Vườn trái cây', 'Ao cá', 'Chuồng trại', 'Lồng bè', 'Rừng ngập mặn', 'Vườn quốc gia', 'Khu bảo tồn', 'Suối nước nóng', 'Miệng núi lửa', 'Băng cực'
    ]
  },
  {
    id: 'items',
    name: 'Đồ vật',
    words: [
        'Điện thoại', 'Máy tính', 'Cái ghế', 'Đôi giày', 'Cái đồng hồ', 'Cây bút', 'Cái ly', 'Mắt kính', 'Tai nghe', 'Cái bàn',
        'Cái giường', 'Cái tủ', 'Cái gương', 'Cái lược', 'Bàn chải', 'Kem đánh răng', 'Khăn mặt', 'Xà bông', 'Dầu gội', 'Sữa tắm',
        'Cái chậu', 'Cái xô', 'Cái chổi', 'Cây lau nhà', 'Máy hút bụi', 'Bếp ga', 'Nồi', 'Chảo', 'Dao', 'Thớt',
        'Chén', 'Dĩa', 'Muỗng', 'Đũa', 'Tô', 'Ly nước', 'Bình nước', 'Ấm đun nước', 'Tủ lạnh', 'Lò vi sóng',
        'Lò nướng', 'Máy xay sinh tố', 'Máy ép trái cây', 'Máy giặt', 'Bàn ủi', 'Quạt', 'Máy lạnh', 'Đèn', 'Tivi', 'Loa',
        'Micro', 'Đàn guitar', 'Đàn piano', 'Trống', 'Sáo', 'Sách', 'Vở', 'Thước kẻ', 'Cục tẩy', 'Hộp bút',
        'Cặp sách', 'Balo', 'Túi xách', 'Ví', 'Nón', 'Áo', 'Quần', 'Váy', 'Đầm', 'Áo khoác',
        'Khăn choàng', 'Găng tay', 'Vớ', 'Thắt lưng', 'Đồng hồ đeo tay', 'Nhẫn', 'Dây chuyền', 'Bông tai', 'Lắc tay', 'Mắt kính râm',
        'Dù', 'Áo mưa', 'Xe đạp', 'Xe máy', 'Xe hơi', 'Xe buýt', 'Xe tải', 'Máy bay', 'Tàu hỏa', 'Thuyền',
        'Chìa khóa', 'Ổ khóa', 'Két sắt', 'Vali', 'Bật lửa', 'Diêm', 'Nến', 'Đèn pin', 'Pin', 'Sạc dự phòng',
        'Cáp sạc', 'Chuột máy tính', 'Bàn phím', 'Màn hình', 'Máy in', 'Máy photocopy', 'Máy ảnh', 'Chân máy ảnh', 'Thẻ nhớ', 'USB',
        'Đĩa CD', 'Băng cassette', 'Máy nghe nhạc', 'Loa bluetooth', 'Tai nghe không dây', 'Đồng hồ treo tường', 'Lịch', 'Tranh ảnh', 'Bình hoa', 'Gạt tàn',
        'Thùng rác', 'Cây lau kính', 'Búa', 'Kìm', 'Tua vít', 'Cờ lê', 'Khoan', 'Cưa', 'Đinh', 'Ốc vít'
    ]
  },
  {
    id: 'jobs',
    name: 'Nghề nghiệp',
    words: [
        'Bác sĩ', 'Y tá', 'Giáo viên', 'Công an', 'Bộ đội', 'Kỹ sư', 'Kiến trúc sư', 'Họa sĩ', 'Ca sĩ', 'Diễn viên',
        'Nhạc sĩ', 'Nhà văn', 'Nhà báo', 'Luật sư', 'Thẩm phán', 'Kế toán', 'Thư ký', 'Giám đốc', 'Nhân viên', 'Bảo vệ',
        'Lao công', 'Đầu bếp', 'Phục vụ', 'Pha chế', 'Thợ cắt tóc', 'Thợ trang điểm', 'Thợ chụp ảnh', 'Thợ may', 'Thợ mộc', 'Thợ xây',
        'Thợ điện', 'Thợ sửa xe', 'Tài xế', 'Phi công', 'Tiếp viên hàng không', 'Thuyền trưởng', 'Ngư dân', 'Nông dân', 'Công nhân', 'Thợ hàn',
        'Bán hàng', 'Môi giới', 'Hướng dẫn viên', 'Phiên dịch', 'Lập trình viên', 'Thiết kế đồ họa', 'Người mẫu', 'Vũ công', 'Ảo thuật gia', 'Vận động viên',
        'Huấn luyện viên', 'Trọng tài', 'Bình luận viên', 'Youtuber', 'Streamer', 'Tiktoker', 'Bác sĩ thú y', 'Nha sĩ', 'Dược sĩ', 'Nhà khoa học',
        'Nhà phi hành', 'Nhà khảo cổ', 'Thám tử', 'Lính cứu hỏa', 'Cứu hộ', 'Tu sĩ', 'Mục sư', 'Chính trị gia', 'Tổng thống', 'Vua',
        'Hoàng hậu', 'Công chúa', 'Hoàng tử', 'Thợ rèn', 'Thợ gốm', 'Thợ điêu khắc', 'Thợ làm bánh', 'Thợ sửa ống nước', 'Thợ sửa khóa', 'Thợ sửa đồng hồ',
        'Người giao hàng', 'Tạp vụ', 'Quản lý', 'Trợ lý', 'Thực tập sinh', 'Nghiên cứu sinh', 'Giảng viên', 'Hiệu trưởng', 'Bảo mẫu', 'Giúp việc',
        'Đạo diễn', 'Biên kịch', 'Quay phim', 'Kỹ thuật viên', 'Biên tập viên', 'Phát thanh viên', 'MC', 'DJ', 'Rapper', 'Vũ sư',
        'Huấn luyện viên xiếc', 'Người dạy thú', 'Người nuôi ong', 'Kiểm lâm', 'Nhà khí tượng học', 'Nhà thiên văn học', 'Nhà tâm lý học', 'Chuyên gia dinh dưỡng', 'Stylist', 'Blogger'
    ]
  }
];
