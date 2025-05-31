const validateRegisterInput = (formData) => {
  const {
    username = "",
    password = "",
    fullName = "",
    email = "",
    phoneNumber = "",
    gender = "",
  } = formData;

  if (!username.trim()) {
    return "Tên đăng nhập không được để trống.";
  }
  if (!password.trim()) {
    return "Mật khẩu không được để trống.";
  }
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  if (!fullName.trim()) {
    return "Họ và tên không được để trống.";
  }
  if (!email.trim()) {
    return "Email không được để trống.";
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Email không hợp lệ.";
  }
  if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber)) {
    return "Số điện thoại không hợp lệ.";
  }
  const allowedGenders = ["Male", "Female", "Other"];
  if (!allowedGenders.includes(gender)) {
    return "Giới tính không hợp lệ.";
  }

  return null; // Không có lỗi
};

export default validateRegisterInput;