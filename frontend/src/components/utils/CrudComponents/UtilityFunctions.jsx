import React, {useState, useEffect} from 'react';

export function FilterDetailColumns (columns, groups, data) {
    const filteredGroups = () => {
        let grps = [];
        groups?.map((group) => {
          let passed = false;
         columns?.map((column) => {
            let conditions = [];
            const dependencies = column?.dependencies?.dependencies;
            if (dependencies) {
              let pass = true;
    
              Object.keys(dependencies)?.map((depKey) => {
                let { value, op, valueType, type, formula } = dependencies[depKey];
                if (valueType == "ref") {
                  value =
                    type == "formula"
                      ? parseFloat(data[value])
                      : data[value];
                }
                let cond = false;
    
                if (type == "value") {
                  switch (op) {
                    case "==":
                      {
                        if (data[depKey] == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (data[depKey] != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (data[depKey] <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (data[depKey] >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (data[depKey] < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (data[depKey] > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (data[depKey] === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (data[depKey] !== value) {
                          cond = true;
                        }
                      }
                      break;
                  }
                } else if (type == "formula") {
                  let formulaValue = "";
                  formula?.map((form) => {
                    const { target, type } = form;
                    let val = "";
                    if (type == "field") {
                      val = parseFloat(data[target]);
                    } else {
                      val = target;
                    }
                    formulaValue = formulaValue + val;
                  });
                  const formulaResult = eval(formulaValue);
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                }
                conditions.push(cond);
                // if(data[depKey]!==dependencies[depKey]) {
                //    pass = false;
                // }
              });
              const op = column?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (conditions?.every((element) => element === true)) {
                  pass = true;
                } else {
                  pass = false;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (conditions?.some((element) => element === true)) {
                  pass = true;
                } else {
                  pass = false;
                }
              }
              if (!pass) {
                return;
              }
            }
    
            if (column?.group === group.id) {
              passed = true;
            }
          });
          if (passed) {
            grps.push(group);
          }
        });
        return grps;
      };

    const filteredColumns =  () => {
        let newColumns = []
         columns?.map((column)=>{
            let br = false;
            if (column?.dependencies) {
              let conditions = [];
              const dependencies = column?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
                if (valueType == "ref") {
                  value =
                    type == "formula"
                      ? parseFloat(data[value])
                      : data[value];
                }
                let cond = false;
                if (type == "value") {
                  switch (op) {
                    case "==":
                      {
                        if (data[dependency] == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (data[dependency] != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (data[dependency] <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (data[dependency] >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (data[dependency] < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (data[dependency] > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (data[dependency] === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (data[dependency] !== value) {
                          cond = true;
                        }
                      }
                      break;
                  }
                } else if (type == "formula") {
                  let formulaValue = "";
                  formula?.map((form) => {
                    const { target, type, index, array, date } = form;
                    let val = "";
                    if (type == "field") {
                      if(array) {
                        if(date) {
                          val = 'new Date("'+data[target]?.[index]+'")';
                        }
                        else {
                          val = parseFloat(data[target]?.[index]);
                        }
                      }
                      else {
                        if(date) {
                          val = 'new Date("'+data[target]+'")';
                        }
                        else {
                          val = parseFloat(data[target]);
                        }
                      }
                    } else {
                      val = target;
                    }
                    formulaValue = formulaValue + val;
                  });
                  const formulaResult = eval(formulaValue);
                  try {
                    if (eval(formulaResult + op + value)) {
                      cond = true;
                    }
                  } catch(e) {}
                }
                conditions.push(cond);
              });
              const op = column?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (!br) {
                return newColumns.push(column);
            }
        })
        return newColumns;
    }

    return {newColumns: filteredColumns(), newGroups: filteredGroups()}
}

function matchFilter(value, filter) {
  const { type, field, op, value: filterValue } = filter;
  if (type === 'value') {
    switch (op) {
      case '==':
        return value === filterValue;
      case '!=':
        return value !== filterValue;
      case '>':
        return value > filterValue;
      case '<':
        return value < filterValue;
      case '>=':
        return value >= filterValue;
      case '<=':
        return value <= filterValue;
      default:
        return false;
    }
  }
  if (type === 'date') {
    const dateValue = new Date(value);
    const dateFilterValue = new Date(filterValue);
    switch (op) {
      case '==':
        return dateValue.getTime() === dateFilterValue.getTime();
      case '!=':
        return dateValue.getTime() !== dateFilterValue.getTime();
      case '>':
        return dateValue.getTime() > dateFilterValue.getTime();
      case '<':
        return dateValue.getTime() < dateFilterValue.getTime();
      case '>=':
        return dateValue.getTime() >= dateFilterValue.getTime();
      case '<=':
        return dateValue.getTime() <= dateFilterValue.getTime();
      default:
        return false;
    }
  }
  return false;
}

export function filterData(data, filters, selectedFilters) {
  const filteredCustomFilters = filters?.filter((customFilter, index) => {
    const indexKey = `index-${index}`;
    return selectedFilters[indexKey] === true;
  });

  return data?.filter((obj) => {
    return filteredCustomFilters.every((customFilter) => {
      const { filter } = customFilter;
      return filter.every((condition) => {
        const { field, value } = condition;
        const objValue = obj[field]
        return matchFilter(objValue, condition);
      });
    });
  });
}

export const useWindowWidth = () => {
  const [width, setWidth] = useState(window?.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
};