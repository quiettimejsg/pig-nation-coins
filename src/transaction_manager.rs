use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: String,
    pub user_id: String,
    pub amount: f64,
    pub currency: String,
    pub transaction_type: String,
    pub timestamp: DateTime<Utc>,
    pub description: Option<String>,
}

impl Transaction {
    pub fn new(
        id: String,
        user_id: String,
        amount: f64,
        currency: String,
        transaction_type: String,
        description: Option<String>,
    ) -> Self {
        Transaction {
            id,
            user_id,
            amount,
            currency,
            transaction_type,
            timestamp: Utc::now(),
            description,
        }
    }
}

pub struct TransactionManager {
    transactions: Vec<Transaction>,
}

impl TransactionManager {
    pub fn new() -> Self {
        TransactionManager {
            transactions: Vec::new(),
        }
    }

    pub fn add_transaction(&mut self, transaction: Transaction) {
        self.transactions.push(transaction);
    }

    pub fn get_transactions_by_user(&self, user_id: &str) -> Vec<&Transaction> {
        self.transactions
            .iter()
            .filter(|t| t.user_id == user_id)
            .collect()
    }

    pub fn get_transaction_by_id(&self, id: &str) -> Option<&Transaction> {
        self.transactions.iter().find(|t| t.id == id)
    }
}


