// clean username
const cleanName = (name) => {
  const regex = /[^A-Za-z0-9.\-_\s]+/g;
  const result = name.replace(regex, "").trim();
  return result;
};

// clean data
const cleanData = (data) => {
  const regex = /[^a-zA-Z0-9@?,.\s]/g;
  const result = data.replace(regex, "").trim();
  return result;
};

// clean username
const cleanEmail = (email) => {
  const regex = /[^A-Za-z0-9.\-_@]+/g;
  const result = email.replace(regex, "").trim();
  return result;
};

// clean url
const cleanUrl = (url) => {
  const regex = /^\/([\S\s]+)$/;
  // const regex = /^\/([a-zA-Z0-9/-?=]+)$/;
  const result = regex.test(url);
  return result;
};

// exports
module.exports = { cleanName, cleanEmail, cleanUrl, cleanData };
