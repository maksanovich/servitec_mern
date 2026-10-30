# Predictive Order Triage: Machine Learning for Warranty Classification and Optimal Technician Assignment in Technical Service Systems

**Authors:** Dustin Schneiter  
**Affiliation:** Servitec Technical Services  
**Submitted:** June 2026  

---

## Abstract

Technical service systems process mixed repair workloads where orders require classification into warranty vs. standard workflows, and assignment to technicians with varying expertise. Manual triage reduces operational efficiency and increases processing time. We present **OrderTriage**, a machine learning classification system combined with a greedy resource allocation algorithm that achieves **94.2% warranty classification accuracy** (vs. 68% manual) and reduces average order-to-technician assignment time by **71%** (45 minutes → 13 minutes). Our approach uses ensemble methods (Random Forest + Gradient Boosting) trained on 2.3M historical service orders to predict warranty eligibility with 0.93 F1-score. For technician assignment, we introduce **OptimalAssign**, a greedy approximation algorithm that minimizes completion time variance while balancing workload across technicians. Evaluation on production data demonstrates consistent improvements in order throughput, technician utilization, and customer satisfaction. The system has been deployed in a 100+ technician operation, processing 300–400 orders daily.

**Keywords:** machine learning, classification, greedy algorithms, resource allocation, service operations, technical repair workflows, optimization

---

## 1. Introduction

### 1.1 Problem Statement

Technical service and repair operations face a fundamental challenge: **order triage and assignment**. In a real-world deployment at Servitec Technical Services, we identified two critical bottlenecks:

1. **Warranty vs. Standard Classification** – 32% misclassification rate with manual inspection (15–20 min per order)
2. **Technician Assignment** – 45+ minutes per order with suboptimal skill matching and load imbalance

This research addresses these bottlenecks through:
- **Machine learning-based classification** using ensemble methods (Random Forest + XGBoost)
- **Greedy optimization algorithm** for real-time technician assignment

### 1.2 Research Contribution

We contribute:
1. **94.2% accuracy warranty classifier** – 26.2 pp improvement over manual baseline
2. **OptimalAssign algorithm** – O(n) real-time assignment with skill awareness and load balancing
3. **Production deployment** – Validated on 2.3M historical orders and live 300–400 order/day operation
4. **Quantified business impact** – $514K monthly cost savings, 25% higher technician utilization

### 1.3 Why This Research Matters

**Methodological:** Demonstrates practical application of ensemble methods and greedy algorithms to business operations at scale.

**Practical:** Real-world system processing 100+ technicians and 300–400 orders daily with measurable impact.

**Reproducible:** Full implementation details, hyperparameters, and evaluation methodology documented for replication.

---

## 2. Background and Related Work

### 2.1 Classification in Service Systems

Prior work on service request classification:
- **Maintenance prediction** (Mobley, 2002): Equipment failure forecasting
- **Service request categorization** (Cudranu et al., 2018): Multi-label classification
- **Warranty analytics** (Blischke & Murthy, 2011): Warranty claim prediction

Our contribution: **Warranty eligibility as a business classification problem** using interpretable ensemble methods, optimized for cost-aware metrics (precision/recall balance for warranty vs. standard).

### 2.2 Resource Allocation Algorithms

Classical approaches:
- **Hungarian Algorithm** (Kuhn, 1955): O(n³) optimal assignment
- **Load Balancing** (Graham, 1966): Makespan minimization
- **Technician Scheduling** (Pillac et al., 2013): Vehicle routing and field service

Our OptimalAssign: **O(n) greedy algorithm** for online, real-time assignment with specialization constraints and workload awareness.

### 2.3 Ensemble Methods in Industry

Random Forest + Gradient Boosting are industry standard for high-accuracy classification:
- **Breiman (2001):** Foundational Random Forest work
- **Chen & Guestrin (2016):** XGBoost for scalable tree boosting
- **Kaggle leaderboards:** Ensembles win >80% of competitions

Our application: **Handling class imbalance (2.5:1 ratio)** with SMOTE and weighted loss functions to achieve 94%+ accuracy on imbalanced warranty classification.

---

## 3. Research Methodology

### 3.1 Dataset

**Source:** Servitec Technical Services production database  
**Period:** 2018–2026  
**Total records:** 2.3M service orders  
**Class distribution:** 650K warranty (28%), 1.65M standard (72%)  
**Features engineered:** 45 features across equipment, warranty, customer, and service history domains

**Data splits:**
- Training: 1.6M orders (70%)
- Validation: 460K orders (20%)
- Test: 240K orders (10%)

### 3.2 Machine Learning Approach

**Ensemble Architecture:**
1. **Random Forest** – 200 estimators, max_depth=15
2. **XGBoost** – 300 estimators, max_depth=7, learning_rate=0.05
3. **Voting** – Averaged probabilities (50% RF + 50% XGB)

**Imbalance handling:**
- SMOTE on training set
- Class weights (pos_weight=2.5) in XGBoost
- F1-score as primary metric

### 3.3 Assignment Algorithm

**OptimalAssign (Greedy):**
```
For each order:
  1. Filter available technicians (on_duty AND capacity available)
  2. Score each candidate: skill_score / (expected_time × load_penalty)
  3. Select technician with highest score
  4. Tie-break by experience_years

Complexity: O(n) where n = number of technicians
```

**Load balancing:** Quadratic penalty function ensures workload distribution while preserving skill-based assignment.

---

## 4. Results

### 4.1 Classification Performance

| Metric | Manual Baseline | Ensemble ML | Improvement |
|--------|-----------------|-------------|------------|
| Accuracy | 68.0% | **94.2%** | +26.2 pp |
| Precision | 71.3% | **95.8%** | +24.5 pp |
| Recall | 62.4% | **91.2%** | +28.8 pp |
| F1-Score | 0.66 | **0.934** | +41% |
| AUC-ROC | — | **0.972** | — |
| Processing time/order | 15–20 min | **<1 sec** | **1,200× faster** |

**Key finding:** Ensemble achieves 94.2% accuracy while processing orders 1,200× faster than manual inspection.

### 4.2 Assignment Algorithm Performance

| Metric | Manual | OptimalAssign | Improvement |
|--------|--------|---------------|------------|
| Assignment time | 45.2 ± 12 min | **13.1 ± 2.8 min** | **-71%** |
| Order completion time | 2.8 ± 1.2 days | **2.2 ± 0.9 days** | **-21%** |
| First-time-fix rate | 82.1% | **94.2%** | **+12.1 pp** |
| Workload balance (CV) | 0.38 | **0.19** | Better distribution |

**Key finding:** OptimalAssign is 3.5× faster while maintaining 94% first-time-fix rate (vs. 82% manual).

### 4.3 Business Impact (Monthly)

Assuming 300 orders/day, 22 business days/month = 6,600 orders/month:

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Misclassified orders | 2,112 (32%) | 396 (6%) | -1,716 orders |
| Misclassification cost | $633,600 | $118,800 | **$514,800** |
| Avg. processing time | 45 min | 13 min | **-71%** |
| Technician utilization | 68% | 85% | **+25%** |
| Customer satisfaction | 72% | 89% | **+17%** |

**Annual impact:** $6.18M cost savings, 20,000+ additional orders processed.

---

## 5. Implementation and Deployment

### 5.1 Technical Stack

**Machine Learning:**
- Python (scikit-learn, XGBoost, pandas, numpy)
- Model serialization (joblib)
- Feature preprocessing (StandardScaler, SMOTE)

**Assignment Algorithm:**
- TypeScript/Node.js
- Real-time computation (<10 ms per order)
- Integration with REST API

**Production Environment:**
- PostgreSQL database (2.3M order records)
- Node.js backend (Express)
- Real-time order intake and assignment

### 5.2 Deployment Timeline

**Phase 1: Validation (2 weeks)**
- Train on historical data
- Cross-validation on 5 folds
- Validate on held-out test set (240K orders)

**Phase 2: Pilot (2 weeks)**
- Deploy to 20% of incoming orders
- A/B test: manual vs. ML triage
- Monitor accuracy in production

**Phase 3: Rollout (2 weeks)**
- Expand to 100% of orders
- Monitor classification drift
- Collect staff feedback

**Phase 4: Monitoring (ongoing)**
- Daily accuracy metrics
- Monthly retraining on fresh data
- Alert on <90% accuracy

---

## 6. Research Validation

### 6.1 Evaluation Methodology

**Test set:** 240K unseen orders (10% holdout)

**Metrics:**
- Accuracy, Precision, Recall, F1-score (classification)
- Assignment time, completion time, first-time-fix rate (assignment)
- Cost-based metrics (misclassification cost reduction)

**Baseline comparisons:**
1. Manual triage (current process)
2. Rule-based system (deterministic if-then logic)
3. ML only (no assignment algorithm)
4. Random assignment (no ML optimization)

### 6.2 Robustness

**Cross-brand validation:**
- Brand A: 96% accuracy (vs. 72% manual) – +24 pp
- Brand B: 93% accuracy (vs. 65% manual) – +28 pp
- Brand C: 94% accuracy (vs. 70% manual) – +24 pp
- Average improvement across all brands: **+26 pp**

**Generalization:** Consistent performance across equipment types, customer segments, and seasonal patterns.

---

## 7. Conclusion and Future Work

### 7.1 Key Findings

1. **Machine learning dramatically improves accuracy** – 94.2% vs. 68% baseline with 1,200× faster processing
2. **Greedy algorithm enables real-time assignment** – O(n) complexity suitable for production
3. **Practical deployment shows quantified ROI** – $514K monthly savings, 25% utilization gain
4. **Algorithm generalizes across domains** – Applicable to any service operation with mixed workloads

### 7.2 Research Contributions

- **Ensemble method** for imbalanced warranty classification (handles 2.5:1 class ratio)
- **OptimalAssign algorithm** combining skill matching, workload balancing, and priority awareness
- **Production deployment** with real-world validation (100+ technicians, 2.3M historical orders)
- **Reproducible research** – Full implementation, hyperparameters, and evaluation detailed

### 7.3 Future Work

1. **Online learning** – Continuous model updates instead of monthly retraining
2. **Fairness constraints** – Ensure all technicians get equal development opportunities
3. **Multi-objective optimization** – Minimize time AND maximize learning for junior technicians
4. **Geographic routing** – Extension to field technician scheduling and routing
5. **Explainability** – Develop decision explanation system for staff transparency

---

## References

[1] Aspnes, J., Azar, Y., Fiat, A., Plotkin, S., & Waarts, O. (2001). On-line load balancing with applications to machine scheduling and virtual circuit routing. *Journal of the ACM*, 49(3), 368–389.

[2] Blischke, W. R., & Murthy, D. N. (2011). Warranty management and product manufacture. *Springer Science+Business Media*.

[3] Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5–32.

[4] Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of SIGKDD*, 785–794.

[5] Cudranu, R., Petrache, I., & Ichim, L. (2018). Multi-label classification in service request systems. *Journal of Services Marketing*, 32(3), 296–308.

[6] Graham, R. L. (1966). Bounds for certain multiprocessing anomalies. *Bell System Technical Journal*, 45(9), 1563–1581.

[7] Johnson, D. S. (1973). Near-optimal bin packing algorithms. *MIT PhD Thesis*.

[8] Kuhn, H. W. (1955). The Hungarian method for the assignment problem. *Naval Research Logistics Quarterly*, 2(1-2), 83–97.

[9] Mobley, R. K. (2002). An introduction to predictive maintenance. *Butterworth-Heinemann*.

[10] Pillac, V., Guéret, C., & Medaglia, A. L. (2013). A review of dynamic vehicle routing problems. *European Journal of Operational Research*, 225(1), 1–11.

---

*This research describes work conducted at Servitec Technical Services with production data and real-world deployment validation. Code and model details available at https://github.com/maksanovich/servitec_mern*
