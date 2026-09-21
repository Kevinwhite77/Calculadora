import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Operator = '÷' | '×' | '−' | '+';

function operate(a: number, b: number, op: Operator): number | null {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return null;
      return a / b;
    default:
      return null;
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  // Evita errores de punto flotante como 0.1 + 0.2 = 0.30000000004
  const rounded = parseFloat(value.toPrecision(10));
  let str = String(rounded);
  // Limita longitud para que no rompa el layout
  if (str.length > 12) {
    if (Math.abs(rounded) >= 1e12 || Math.abs(rounded) < 1e-7) {
      return rounded.toExponential(5);
    }
    str = rounded.toFixed(8).replace(/\.?0+$/, '');
  }
  return str;
}

export default function App() {
  const [current, setCurrent] = useState('0');
  const [previous, setPrevious] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const expression = useMemo(() => {
    if (previous === null || operator === null) return '';
    return `${previous} ${operator}`;
  }, [previous, operator]);

  const inputDigit = (digit: string) => {
    if (justEvaluated) {
      setCurrent(digit);
      setJustEvaluated(false);
      return;
    }
    if (current === 'Error') {
      setCurrent(digit);
      return;
    }
    const clean = current.replace('-', '').replace('.', '');
    if (clean.length >= 9) return;
    if (current === '0') setCurrent(digit);
    else if (current === '-0') setCurrent('-' + digit);
    else setCurrent(current + digit);
  };

  const inputDot = () => {
    if (justEvaluated) {
      setCurrent('0.');
      setJustEvaluated(false);
      return;
    }
    if (current === 'Error') {
      setCurrent('0.');
      return;
    }
    if (!current.includes('.')) setCurrent(current + '.');
  };

  const clearAll = () => {
    setCurrent('0');
    setPrevious(null);
    setOperator(null);
    setJustEvaluated(false);
  };

  const deleteLast = () => {
    if (justEvaluated || current === 'Error') {
      clearAll();
      return;
    }
    if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
      setCurrent('0');
    } else {
      setCurrent(current.slice(0, -1));
    }
  };

  const toggleSign = () => {
    if (current === '0' || current === 'Error') return;
    setCurrent(current.startsWith('-') ? current.slice(1) : '-' + current);
  };

  const inputPercent = () => {
    if (current === 'Error') return;
    const value = parseFloat(current);
    if (Number.isNaN(value)) return;
    setCurrent(formatResult(value / 100));
    setJustEvaluated(true);
  };

  const inputOperator = (next: Operator) => {
    if (current === 'Error') return;
    // Operación encadenada: 2 + 3 + → calcula 5 y sigue
    if (previous !== null && operator !== null && !justEvaluated) {
      const a = parseFloat(previous);
      const b = parseFloat(current);
      const result = operate(a, b, operator);
      if (result === null) {
        setCurrent('Error');
        setPrevious(null);
        setOperator(null);
        setJustEvaluated(true);
        return;
      }
      const formatted = formatResult(result);
      setPrevious(formatted);
      setCurrent(formatted);
    } else {
      setPrevious(current);
    }
    setOperator(next);
    setJustEvaluated(true);
  };

  const equals = () => {
    if (previous === null || operator === null || current === 'Error') return;
    // Evita repetir = sin nuevo número: usa el current visible
    const a = parseFloat(previous);
    const b = parseFloat(current);
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    const result = operate(a, b, operator);
    if (result === null) {
      setCurrent('Error');
    } else {
      setCurrent(formatResult(result));
    }
    setPrevious(null);
    setOperator(null);
    setJustEvaluated(true);
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    variant: 'number' | 'operator' | 'function' = 'number',
    flex = 1,
  ) => {
    const isActiveOperator = variant === 'operator' && operator === label && justEvaluated;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          variant === 'number' && styles.buttonNumber,
          variant === 'operator' && styles.buttonOperator,
          variant === 'function' && styles.buttonFunction,
          isActiveOperator && styles.buttonOperatorActive,
          { flex },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            variant === 'function' ? styles.buttonTextDark : styles.buttonTextLight,
            label === '⌫' && styles.buttonTextSmall,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.display}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.expression}>
            {expression}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.result}>
            {current}
          </Text>
        </View>

        <View style={styles.keypad}>
          <View style={styles.row}>
            {renderButton('C', clearAll, 'function')}
            {renderButton('+/-', toggleSign, 'function')}
            {renderButton('%', inputPercent, 'function')}
            {renderButton('÷', () => inputOperator('÷'), 'operator')}
          </View>
          <View style={styles.row}>
            {renderButton('7', () => inputDigit('7'))}
            {renderButton('8', () => inputDigit('8'))}
            {renderButton('9', () => inputDigit('9'))}
            {renderButton('×', () => inputOperator('×'), 'operator')}
          </View>
          <View style={styles.row}>
            {renderButton('4', () => inputDigit('4'))}
            {renderButton('5', () => inputDigit('5'))}
            {renderButton('6', () => inputDigit('6'))}
            {renderButton('−', () => inputOperator('−'), 'operator')}
          </View>
          <View style={styles.row}>
            {renderButton('1', () => inputDigit('1'))}
            {renderButton('2', () => inputDigit('2'))}
            {renderButton('3', () => inputDigit('3'))}
            {renderButton('+', () => inputOperator('+'), 'operator')}
          </View>
          <View style={styles.row}>
            {renderButton('0', () => inputDigit('0'), 'number', 2.15)}
            {renderButton('.', inputDot)}
            {renderButton('⌫', deleteLast, 'number')}
          </View>
          <View style={styles.row}>
            {renderButton('=', equals, 'operator', 4)}
          </View>
        </View>
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const buttonSize = Math.min((width - 24 * 2 - 12 * 3) / 4, 92);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-end',
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 16,
    minHeight: 140,
  },
  expression: {
    color: '#9a9a9a',
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  result: {
    color: '#ffffff',
    fontSize: 72,
    fontWeight: '300',
    lineHeight: 80,
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: buttonSize,
    minHeight: 64,
    borderRadius: buttonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonNumber: {
    backgroundColor: '#333333',
  },
  buttonOperator: {
    backgroundColor: '#FF9F0A',
  },
  buttonOperatorActive: {
    backgroundColor: '#ffffff',
  },
  buttonFunction: {
    backgroundColor: '#A5A5A5',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: '400',
  },
  buttonTextLight: {
    color: '#ffffff',
  },
  buttonTextDark: {
    color: '#000000',
  },
  buttonTextSmall: {
    fontSize: 26,
  },
});
