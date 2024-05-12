const pick = (
    obj,
    keys
  )=> {
    const finalObj = {};
  
    for (const key of keys) {
      if (obj && obj.hasOwnProperty.call(obj, key)) {
        finalObj[key] = obj[key];
      }
    }
    return finalObj;
  };
  
  module.exports = pick;