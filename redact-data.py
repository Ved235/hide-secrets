from Crypto.Util.number import long_to_bytes, inverse
import sympy

# --- your values ---
N  = 30327208759781412025136331048643419536910103237132356122012246111636453702769363409081910784093069558218111
ct = 17809769080654903649334892184111600681027552797084733634899402165936938957467437130366159467052858323916324

# 1) Factor N by trial dividing all 10-bit primes ≡3 mod 4
primes = [p for p in range(512, 1024)
             if sympy.isprime(p) and p % 4 == 3 and N % p == 0]

# 2) Compute a square root of ct mod each p
roots = [pow(ct, (p+1)//4, p) for p in primes]

# 3) Recombine via CRT
x, M = 0, 1
for p, r in zip(primes, roots):
    inv = inverse(M, p)
    x   = (x + (r - x) * inv * M) % (M * p)
    M  *= p

# 4) Choose the “small” representative
m = x if x <= N//2 else N - x

# 5) Convert back to bytes
print(long_to_bytes(m).decode("utf-8"))   # → b'SVUSCG{…}' 
