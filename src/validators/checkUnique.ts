class CheckUnique {
  static handle(value: string, existingValues: string[]): boolean {
    return !existingValues.includes(value);
  }
}
export default CheckUnique;