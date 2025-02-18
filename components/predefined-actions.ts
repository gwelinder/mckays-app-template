// components/predefined-actions.ts

export interface PredefinedAction {
  title: string
  description: string
  command: string
}

export const predefinedActions: PredefinedAction[] = [
  // Corporate Governance
  {
    title: "Review Corporate Governance Policies",
    description:
      "Ensure all corporate governance policies are up-to-date and compliant with Danish laws.",
    command:
      "Review the current corporate governance policies and suggest necessary updates for compliance with Danish laws."
  },
  {
    title: "Board Composition Analysis",
    description:
      "Analyze the current board composition for diversity and expertise.",
    command:
      "Analyze the current board composition and provide recommendations to enhance diversity and expertise."
  },

  // Financial Oversight
  {
    title: "Financial Statement Analysis",
    description:
      "Evaluate the company's financial statements for accuracy and compliance.",
    command:
      "Analyze the latest financial statements for accuracy, compliance with Danish accounting standards, and provide insights."
  },
  {
    title: "Budget Review and Approval",
    description:
      "Assess and approve the annual budget to ensure financial stability.",
    command:
      "Review the proposed annual budget, assess its feasibility, and provide approval or recommendations for adjustments."
  },

  // Risk Management
  {
    title: "Enterprise Risk Assessment",
    description: "Identify and assess key risks facing the organization.",
    command:
      "Conduct an enterprise risk assessment to identify key risks and suggest mitigation strategies."
  },
  {
    title: "Crisis Management Planning",
    description:
      "Develop and review crisis management plans to handle potential emergencies.",
    command:
      "Develop a comprehensive crisis management plan and review existing plans for effectiveness and readiness."
  },

  // Compliance and Legal
  {
    title: "Regulatory Compliance Check",
    description:
      "Ensure the company complies with all relevant Danish regulations.",
    command:
      "Perform a regulatory compliance check to ensure the company adheres to all relevant Danish laws and regulations."
  },
  {
    title: "Legal Contract Review",
    description:
      "Review key legal contracts to mitigate potential liabilities.",
    command:
      "Review the latest key legal contracts and identify any clauses that may pose potential liabilities or compliance issues."
  },

  // Environmental, Social, and Governance (ESG)
  {
    title: "ESG Performance Evaluation",
    description:
      "Assess the company's ESG performance and sustainability initiatives.",
    command:
      "Evaluate the company's ESG performance and suggest improvements for sustainability initiatives."
  },
  {
    title: "Sustainability Reporting",
    description:
      "Prepare and review sustainability reports in line with Danish and international standards.",
    command:
      "Prepare a sustainability report adhering to Danish and international ESG reporting standards and review existing reports for compliance."
  },

  // Data Protection and GDPR
  {
    title: "GDPR Compliance Audit",
    description:
      "Ensure the company complies with GDPR regulations regarding data protection.",
    command:
      "Conduct a GDPR compliance audit to ensure all data protection measures meet European Union standards."
  },
  {
    title: "Data Protection Impact Assessment",
    description:
      "Assess the impact of data processing activities on data privacy.",
    command:
      "Perform a Data Protection Impact Assessment (DPIA) for recent data processing activities to identify and mitigate privacy risks."
  },

  // Meeting Management
  {
    title: "Board Meeting Minutes Review",
    description:
      "Review and approve the minutes from the latest board meeting.",
    command:
      "Review the minutes from the latest board meeting for accuracy and completeness, then approve them."
  },
  {
    title: "Agenda Preparation for Upcoming Meetings",
    description: "Prepare and organize the agenda for the next board meeting.",
    command:
      "Prepare a detailed agenda for the upcoming board meeting, ensuring all key topics are covered."
  },

  // Conflict of Interest Management
  {
    title: "Conflict of Interest Declaration",
    description:
      "Collect and review declarations of conflicts of interest from board members.",
    command:
      "Collect conflict of interest declarations from all board members and review them for any potential issues."
  },
  {
    title: "Conflict of Interest Policy Review",
    description:
      "Ensure the conflict of interest policy is comprehensive and up-to-date.",
    command:
      "Review the current conflict of interest policy and suggest updates to address any gaps or changes in regulations."
  },

  // Additional Liability Minimization Actions
  {
    title: "Director Liability Insurance Review",
    description:
      "Ensure that director liability insurance policies are adequate and up-to-date.",
    command:
      "Review the current director liability insurance policies to ensure they provide adequate coverage and recommend any necessary updates."
  },
  {
    title: "Compliance Training for Board Members",
    description:
      "Organize and review compliance training programs for board members.",
    command:
      "Organize a compliance training session for board members and evaluate the effectiveness of existing training programs."
  },
  {
    title: "Internal Audit Coordination",
    description:
      "Coordinate with internal auditors to ensure thorough audits are conducted.",
    command:
      "Coordinate with the internal audit team to plan and execute comprehensive audits, and review audit findings for action items."
  },
  {
    title: "Whistleblower Policy Implementation",
    description:
      "Implement and review whistleblower policies to protect and encourage reporting of unethical behavior.",
    command:
      "Implement a whistleblower policy and review its effectiveness in encouraging the reporting of unethical or illegal activities within the company."
  },
  {
    title: "Board Member Induction and Training",
    description:
      "Ensure new board members receive proper induction and ongoing training.",
    command:
      "Develop and execute an induction program for new board members and provide ongoing training to enhance their governance skills."
  },
  {
    title: "Legal Compliance Monitoring",
    description:
      "Continuously monitor and update legal compliance requirements.",
    command:
      "Set up a system for continuous monitoring of legal compliance requirements and ensure timely updates to policies and procedures."
  },
  {
    title: "Stakeholder Engagement Strategy",
    description:
      "Develop strategies for effective engagement with stakeholders to mitigate risks.",
    command:
      "Develop and implement a stakeholder engagement strategy to ensure effective communication and mitigate potential risks arising from stakeholder interactions."
  },
  {
    title: "Corporate Social Responsibility (CSR) Initiatives",
    description:
      "Plan and evaluate CSR initiatives to enhance corporate reputation and compliance.",
    command:
      "Plan and evaluate corporate social responsibility initiatives to enhance the company's reputation and ensure compliance with societal expectations."
  }
]
