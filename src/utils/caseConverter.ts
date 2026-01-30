/**
 * Convertit les clés d'un objet de snake_case vers camelCase
 */
export function toCamelCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v)) as T
  }
  
  if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
      return result
    }, {} as any) as T
  }
  
  return obj
}

/**
 * Convertit les clés d'un objet de camelCase vers snake_case
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v)) as T
  }
  
  if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = toSnakeCase(obj[key])
      return result
    }, {} as any) as T
  }
  
  return obj
}