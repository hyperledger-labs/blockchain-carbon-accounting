import { FC } from "react";

const TermsOfUse : FC<{}> = () => {
    return (
      <>
        <h1>Terms of Use</h1>
        <p>
        Use of this application or website is subject to the{" "}
        <a
            href="https://github.com/opentaps/open-climate-investing/blob/main/LICENSE"
            rel="noreferrer"
            target="_blank"
        >
            License
        </a>
        . We specifically do not guarantee the accuracy, completeness,
        efficiency, timeliness, or correct sequencing of any
        information. Use of such information is voluntary, and
        reliance on it should only be undertaken after an independent
        review of its accuracy, completeness, efficiency, and
        timeliness. We assume no responsibility for consequences
        resulting from the use of the information herein, or from use
        of the information obtained at linked Internet addresses, or
        in any respect for the content of such information, including
        (but not limited to ) errors or omissions, the accuracy or
        reasonableness of factual or scientific assumptions, studies
        or conclusions, the defamatory nature of statements, ownership
        of copyright or other intellectual property rights, and the
        violation of property, privacy, or personal rights of others.
        We are not responsible for, and expressly disclaims all
        liability for, damages of any kind arising out of use,
        reference to, or reliance on such information. No guarantees
        or warranties, including (but not limited to) any express or
        implied warranties of merchantability or fitness for a
        particular use or purpose, are made with respect to such
        information. At certain places on this application and
        website, live links to other Internet addresses can be
        accessed. Such external Internet addresses contain information
        created, published, maintained, or otherwise posted by
        institutions or organizations independent of us. We do not
        endorse, approve, certify, or control these external Internet
        addresses and does not guarantee the accuracy, completeness,
        efficacy, timeliness, or correct sequencing of information
        located at such addresses. Use of information obtained from
        such addresses is voluntary, and reliance on it should only be
        undertaken after an independent review of its accuracy,
        completeness, efficacy, and timeliness. Reference therein to
        any specific commercial product, process, or service by
        tradename, trademark, service mark, manufacturer, or otherwise
        does not constitute or imply endorsement, recommendation, or
        favoring by us.
        </p>
      </>
    )
}

export default TermsOfUse;