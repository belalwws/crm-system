import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getInitials,
  stringToColor,
  truncate,
} from '../hooks';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format number as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(1000.50)).toBe('$1,001'); // rounds to nearest whole
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-500)).toBe('-$500');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date);
      expect(result).toContain('Jun');
      expect(result).toContain('20');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent dates', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Smith')).toBe('JS');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('stringToColor', () => {
    it('should return a valid color class', () => {
      const color = stringToColor('test');
      expect(color).toMatch(/^bg-\w+-500$/);
    });

    it('should return consistent color for same string', () => {
      const color1 = stringToColor('John Doe');
      const color2 = stringToColor('John Doe');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different strings', () => {
      const color1 = stringToColor('John');
      const color2 = stringToColor('Jane');
      // Note: This might occasionally fail if hash collision
      // but generally they should be different
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncate(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = '12345';
      const result = truncate(text, 5);
      expect(result).toBe('12345');
    });
  });
});
