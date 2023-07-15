import _ from "lodash";

export const DEFAULT_PAGE_NUMBER = 1;

export const getFilteredFields = (updateFields, allowedFields, excludedFields = []) => {
  return Object.keys(updateFields)
    .filter((field) => allowedFields.includes(field) && !excludedFields.includes(field))
    .reduce((obj, field) => {
      obj[field] = updateFields[field];
      return obj;
    }, {});
};

export const getQueryData = (fields, isUpdate = false, indexOffset = 1) => {
  const columns = Object.keys(fields);
  const values = Object.values(fields).filter((value, index) => {
    if (value === undefined) {
      // remove corresponding columns with undefined values
      columns.splice(index, 1);
      return false;
    }
    return true;
  });
  const data = {};
  if (isUpdate) {
    data.params = columns
      .map((col, index) => `${col} = $${index + indexOffset}`)
      .join(", ");
  } else {
    data.placeholders = {
      columns: columns.join(", "),
      values: columns
        .map((col, index) => `$${index + indexOffset}`)
        .join(", "),
    };
  }

  return {
    columns,
    values,
    ...data,
  };
};

export const formatKeysToSnakeCase = (obj) => {
  const snakeCaseObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeCaseKey = _.snakeCase(key).toLowerCase();
      snakeCaseObj[snakeCaseKey] = obj[key];
    }
  }
  return snakeCaseObj;
};

export const getQueryOffset = (pageNumber, limit) => {
  return (pageNumber - 1) * limit;
};
