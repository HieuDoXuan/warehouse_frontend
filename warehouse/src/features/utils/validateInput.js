const validateInput = (username = "", password = "") => {
  if (typeof username !== "string" || !username.trim()) {
    return "Tên đăng nhập không được để trống.";
  }
  if (typeof password !== "string" || !password.trim()) {
    return "Mật khẩu không được để trống.";
  }
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  return null;
};

export default validateInput;