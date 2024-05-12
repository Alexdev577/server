const calculatePagination = (options) => {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 10);
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";
    const startDate = options.startDate ;
    const endDate = options.endDate ;
  
    return {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    };
  };
  
  module.exports = {
    calculatePagination: calculatePagination,
  };
  