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
  const values = Object.values(fields);
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
