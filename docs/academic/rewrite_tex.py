import re

with open("DDIB.tex", "r") as f:
    old_tex = f.read()

intro_match = re.search(r"\\maketitle\n\n(.*?)\n\n\\section", old_tex, re.DOTALL)
intro = intro_match.group(1).strip()

# Find all \section{...} blocks
sections = {}
# Regex to match \section{title} or \section\*{title} followed by content
pattern = r"\\section\\?\*?\{([^}]+)\}(.*?)(?=\\section|\\end\{document\})"
matches = re.finditer(pattern, old_tex, re.DOTALL)

for match in matches:
    title = match.group(1).strip()
    content = match.group(2).strip()
    sections[title] = content

# Construct the new document
new_tex = r"""\documentclass{Resources/bdlt-project}

% :::~ This is the configuration for the bibliography. DO NOT CHANGE
\usepackage[
    backend=biber,
    style=authoryear,
    natbib=false,
    maxcitenames=2,
    minbibnames=1, maxbibnames=99, 
    url=false, 
    doi=true,
    ]{biblatex}
    
\addbibresource{thesis.bib}

\subjectarea{Deep Dive into Blockchain}

\begin{document}
\firstpage{1}

\title{Veridian: Hardware-Attested Tokenization of Cash-Flowing Physical Infrastructure}
\author{Kannan Sasinthiran, Wu Sichen Daniel, Altynai Idirisova, Hiba Chaabouni, Wang Shutong, Josephine Gwendolyn Scherler}
\course{Group Number: 10}
\school{UZH Summer School: Deep Dive into Blockchain (DDiB)}
\date{16 July 2026}

\maketitle

\begin{abstract}
Infrastructure generates predictable, inflation-resistant cash flows, but retail investors are historically locked out due to immense capital requirements, while equipment operators face crippling debt. We introduce Veridian, a decentralized protocol built on Optimism Sepolia that transforms physical asset tokenization into a compliant, self-executing EaaS (Equipment-as-a-Service) escrow. By integrating the ERC-3643 standard with Midnight Network's zk-SNARKs for private KYC, we ensure institutional-grade compliance without compromising investor privacy. Instead of trusting a centralized administrator, Veridian relies on Industrial IoT telemetry secured by TPM 2.0 hardware modules to trigger automated yield distributions via Chainlink. Our analysis proves the economic viability of this model in the solar sector, demonstrating how a 20.7\% yield can be trustlessly split to finance operations, insurance, and network expansion, decentralizing the future of energy yields.
\end{abstract}

\section{Introduction}
""" + intro + "\n\n"

new_tex += r"\section{Theory}" + "\n" + sections["Technical Stack \\& Infrastructure"] + "\n\n"

# Incorporate math into Economic model
economic_text = sections["Economic \\& Allocation Model"]
math_insert = r"""
\subsection{Solar Asset Case Study \& Economic Model}
Based on research into South African solar adoption, a standard 450W panel installation costs R6,750. Operating at an average of 5.5 sun hours per day, the system generates a mathematically verifiable net yield of 20.7\% under the EaaS model. The gross revenue is not captured as monolithic profit, but is trustlessly split according to a strict smart-contract waterfall:
\begin{itemize}
    \item 75\% distributed directly to Investor Yield.
    \item 8\% allocated to Operations \& Maintenance (e.g., SunFix Logistics).
    \item 7\% allocated to Insurance \& Reserve.
    \item 5\% reinvested into the Expansion Fund.
    \item 5\% retained for Platform Operations.
\end{itemize}

"""
economic_text = math_insert + economic_text

new_tex += r"\section{Methods}" + "\n" + sections["Smart Contract Framework"] + "\n\n" + economic_text + "\n\n"

new_tex += r"\section{Results}" + "\n" + sections["Legal \\& Regulatory Integration"] + "\n\n" + sections["5. Industry-Specific Implementation Architectures"] + "\n\n"

new_tex += r"\section{Discussion}" + "\n" + sections["Comparative Ecosystem Context"] + "\n\n" + sections["Critical Risk Metrics \\& Public SLAs"] + "\n\n"

new_tex += r"\section{Conclusion}" + "\n" + sections["Conclusion"] + "\n\n"

new_tex += r"""\section{AUTHOR CONTRIBUTIONS}
The following defines the contributions of the Veridian project team:
Altynai Idirisova conceived and designed the project idea and business model. Hiba Chaabouni and Josephine Gwendolyn Scherler developed the economic models and mathematical yield calculations. Wang Shutong worked on the regulatory implications and securities compliance. Kannan Sasinthiran developed the technical implementation, smart contracts, and frontend architecture. Wu Sichen Daniel designed the visual assets and presentation narrative. All authors revised and accepted the final version of this document.

\printbibliography

\end{document}
"""

with open("DDIB.tex", "w") as f:
    f.write(new_tex)
