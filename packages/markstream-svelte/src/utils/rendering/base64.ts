const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function encodeDataPayload(value: string): string {
  if (!value)
    return ''

  const bytes = new TextEncoder().encode(value)
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    const chunk = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)

    output += BASE64_ALPHABET[(chunk >> 18) & 63]
    output += BASE64_ALPHABET[(chunk >> 12) & 63]
    output += second === undefined
      ? '='
      : BASE64_ALPHABET[(chunk >> 6) & 63]
    output += third === undefined ? '=' : BASE64_ALPHABET[chunk & 63]
  }
  return output
}

export function decodeDataPayload(value: string | null | undefined): string {
  if (!value)
    return ''

  const normalized = value.replace(/\s+/g, '')
  if (
    normalized.length % 4 !== 0
    || !/^[a-z0-9+/]*={0,2}$/i.test(normalized)
  ) {
    return ''
  }

  const bytes: number[] = []
  for (let index = 0; index < normalized.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(normalized[index] ?? '')
    const second = BASE64_ALPHABET.indexOf(normalized[index + 1] ?? '')
    const thirdChar = normalized[index + 2] ?? '='
    const fourthChar = normalized[index + 3] ?? '='
    const third = thirdChar === '=' ? 0 : BASE64_ALPHABET.indexOf(thirdChar)
    const fourth = fourthChar === '=' ? 0 : BASE64_ALPHABET.indexOf(fourthChar)

    if (first < 0 || second < 0 || third < 0 || fourth < 0)
      return ''

    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth
    bytes.push((chunk >> 16) & 255)
    if (thirdChar !== '=')
      bytes.push((chunk >> 8) & 255)
    if (fourthChar !== '=')
      bytes.push(chunk & 255)
  }

  return new TextDecoder().decode(Uint8Array.from(bytes))
}
