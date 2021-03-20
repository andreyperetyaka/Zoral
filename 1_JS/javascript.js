// 1.1

Date.prototype.daysTo = function (date) {
  if (!(date instanceof Date))
    throw new TypeError('Argument should be an instance of Date!');
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs((this - date) / msPerDay));
};

// 1.2

const formatOrders = function (orders) {
  if (!(orders instanceof Array))
    throw new TypeError('Orders should be an instance of Array!');
  return orders
    .map((order) => {
      if (!(order instanceof Object))
        throw new TypeError('Orders should be an Array of Objects!');
      let { amount, quantity } = order;
      if (!(typeof amount === 'number') || amount < 0)
        throw new Error(
          `Order: ${JSON.stringify(
            order
          )} should have value of amount which is non-negative number`
        );
      if (!(typeof quantity === 'number') || quantity < 0)
        throw new Error(
          `Order: ${JSON.stringify(
            order
          )} should have value of quantity which is non-negative number`
        );
      let Total = amount * quantity;
      return { ...order, Total };
    })
    .sort((a, b) => a.Total - b.Total);
};

// 1.3

const getProjection = function (src, proto) {
  if (!(src instanceof Object) || !(proto instanceof Object))
    throw new Error(
      'Please provide two arguments with Object type to the function'
    );
  return Object.getOwnPropertyNames(proto).reduce((object, key) => {
    if (
      proto[key] &&
      proto[key] instanceof Object &&
      src[key] instanceof Object
    ) {
      object[key] = getProjection(src[key], proto[key]);
      return object;
    }
    return src[key]
      ? Object.defineProperty(
          object,
          key,
          Object.getOwnPropertyDescriptor(src, key)
        )
      : object;
  }, {});
};
