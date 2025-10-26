# main.py — Orbite 2D semplificate (due corpi) per CubeSat
# MIT 2025
# Unità: km, s, rad
# Output: lista di tuple (x_km, y_km, t_s) sul piano orbitale

MU = 398600.4418  # km^3 / s^2
RE = 6371.0       # raggio medio Terra (km)

def solve_kepler(M, e, tol=1e-10, itmax=50):
    """Risolvi Keplero per E con metodo di Newton-Raphson: M = E - e sin E"""
    # Porta M in [-pi, pi] per stabilità
    import math
    M = (M + math.pi) % (2*math.pi) - math.pi
    E = M if e < 0.8 else math.pi  # guess
    for _ in range(itmax):
        f = E - e*math.sin(E) - M
        fp = 1 - e*math.cos(E)
        dE = -f/fp
        E += dE
        if abs(dE) < tol:
            break
    return E

def elements_from_perigee_alt(alt_km, e):
    """Calcola semiasse maggiore a da altitudine al perigeo e eccentricità.

    rp = RE + alt_km

    a = rp / (1 - e)

    """
    rp = RE + float(alt_km)
    a = rp / (1.0 - float(e))
    return a

def propagate_from_perigee(alt_km: float, e: float, duration_s: int, dt_s: int):
    """Propaga posizioni 2D per una durata (s), passo dt (s), da perigeo.

    Restituisce: [(x_km,y_km,t_s), ...]

    Modello: due corpi, piano equatoriale, argomento del perigeo = 0, M(0)=0.

    """
    import math
    e = float(e)
    a = elements_from_perigee_alt(alt_km, e)
    n = math.sqrt(MU / (a**3))        # moto medio (rad/s)
    T = 2*math.pi / n                  # periodo (s)
    steps = max(2, int(duration_s//dt_s))

    out = []
    for i in range(steps+1):
        t = i*dt_s
        M = (n * t) % (2*math.pi)     # anomalia media
        E = solve_kepler(M, e)        # anomalia eccentrica
        cosE = math.cos(E); sinE = math.sin(E)
        r = a * (1 - e*cosE)          # raggio
        # anomalia vera
        nu = math.atan2(math.sqrt(1-e*e)*sinE, (cosE - e))
        # coordinate nel piano (pericentro su +X)
        x = r * math.cos(nu)
        y = r * math.sin(nu)
        out.append( (x, y, float(t)) )
    return out
