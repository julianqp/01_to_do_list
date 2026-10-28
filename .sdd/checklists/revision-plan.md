# Checklist · Revisión de plan (Puerta 2)

- [ ] Se basa en la versión **aprobada** de la spec (campo `spec_version`).
- [ ] La tabla de trazabilidad cubre todos los RF, RNF y casos límite.
- [ ] Comprobación de constitución completa; las excepciones están justificadas.
- [ ] Reutiliza código y patrones existentes; las rutas mencionadas existen.
- [ ] Es lo más simple que cumple la spec. Cada abstracción nueva tiene ≥ 2 usos reales.
- [ ] Dependencias nuevas justificadas (o ninguna).
- [ ] Contratos (tipos, API, props) definidos antes que la implementación.
- [ ] Cada decisión relevante tiene alternativas descartadas.
- [ ] Estrategia de pruebas por requisito.
- [ ] Riesgos identificados con mitigación.
- [ ] Despliegue y rollback pensados (migraciones, flags).
- [ ] No añade funcionalidad que no esté en la spec.
- [ ] Sin preguntas abiertas.
- [ ] ¿Alguna decisión es transversal? → ADR.
